<?php

namespace App\Controller;

use App\Entity\Product;
use App\Form\ProductType;
use App\Repository\ProductStockHistoryRepository;
use App\Service\ProductService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use App\Service\FileStorageService;


#[Route('/api/products')]
class ProductController extends AbstractController
{
    private ProductService $productService;
    private FileStorageService $fileStorageService;
    private ProductStockHistoryRepository $productStockHistoryRepository;

    public function __construct(ProductService $productService, FileStorageService $fileStorageService, ProductStockHistoryRepository $productStockHistoryRepository)
    {
        $this->productService = $productService;
        $this->fileStorageService = $fileStorageService;
        $this->productStockHistoryRepository = $productStockHistoryRepository;
    }

    #[Route('/list', name: 'api_product_list', methods: ['GET'])]
    public function list(Request $request, SerializerInterface $serializer): JsonResponse
    {
        $status = $request->query->get('status', 'active');
        $page = (int)$request->query->get('page', 1);
        $itemsPerPage = (int)$request->query->get('itemsPerPage', 10);
        $searchTerm = $request->query->get('search', '');

        $sort = $request->query->get('sort', 'name');
        $order = $request->query->get('order', 'asc');

        $criteria = [
            'category' => $request->query->get('category'),
            'minPrice' => is_numeric($request->query->get('minPrice')) ? (float)$request->query->get('minPrice') : null,
            'maxPrice' => is_numeric($request->query->get('maxPrice')) ? (float)$request->query->get('maxPrice') : null,
            'minStock' => is_numeric($request->query->get('minStock')) ? (int)$request->query->get('minStock') : null,
            'maxStock' => is_numeric($request->query->get('maxStock')) ? (int)$request->query->get('maxStock') : null,
        ];

        switch ($status) {
            case 'deleted':
                $criteria['deleted'] = true;
                break;
            case 'active':
            default:
                $criteria['deleted'] = false;
                break;
        }

        $result = $this->productService->getFilteredAndOrderedProducts($criteria, ['sort' => $sort, 'order' => $order], $searchTerm, $page, $itemsPerPage);

        $products = array_map(function ($product) use ($request) {
            return [
                'id' => $product->getId(),
                'name' => $product->getName(),
                'price' => $product->getPrice(),
                'description' => $product->getDescription(),
                'stockQuantity' => $product->getStockQuantity(),
                'image' => $product->getImage(),
            ];
        }, $result['products']);

        return new JsonResponse([
            'products' => $products,
            'totalItems' => $result['totalItems'],
        ], Response::HTTP_OK);
    }


    #[Route('/{id<\d+>}', name: 'api_product_by_id', methods: ['GET'])]
    public function getProductByIdApi(int $id, SerializerInterface $serializer): JsonResponse
    {
        $product = $this->productService->getProductById($id);

        if (!$product) {
            return new JsonResponse(['error' => 'Product not found'], Response::HTTP_NOT_FOUND);
        }

        $jsonProduct = $serializer->serialize($product, 'json', ['groups' => 'product:read']);
        return new JsonResponse($jsonProduct, Response::HTTP_OK, [], true);
    }

    #[Route('/randomised', name: 'api_product_randomised', methods: ['GET'])]
    public function fetchRandomProducts(Request $request): JsonResponse
    {
        $limit = $request->query->getInt('limit', 5);

        try {
            $products = $this->productService->getRandomProducts($limit);

            $productData = array_map(function ($product) {
                return [
                    'id' => $product->getId(),
                    'name' => $product->getName(),
                    'price' => $product->getPrice(),
                    'description' => $product->getDescription(),
                    'stockQuantity' => $product->getStockQuantity(),
                    'image' => $product->getImage(),
                ];
            }, $products);

            return new JsonResponse(['products' => $productData], Response::HTTP_OK);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Could not fetch random products'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    #[Route('/available/list', name: 'api_available_products', methods: ['GET'])]
    public function availableProducts(Request $request, SerializerInterface $serializer): JsonResponse
    {
        $status = $request->query->get('status', 'active');

        $criteria = [
            'category' => $request->query->get('category'),
            'minPrice' => is_numeric($request->query->get('minPrice')) ? (float)$request->query->get('minPrice') : null,
            'maxPrice' => is_numeric($request->query->get('maxPrice')) ? (float)$request->query->get('maxPrice') : null,
            'minStock' => is_numeric($request->query->get('minStock')) ? (int)$request->query->get('minStock') : null,
            'maxStock' => is_numeric($request->query->get('maxStock')) ? (int)$request->query->get('maxStock') : null,
        ];

        switch ($status) {
            case 'deleted':
                $criteria['deleted'] = true;
                break;
            case 'active':
            default:
                $criteria['deleted'] = false;
                break;
        }

        $products = $this->productService->getAvailableProductsToAddToOrder($criteria, []);

        if (empty($products)) {
            return new JsonResponse(['message' => 'No products found matching the given criteria.'], Response::HTTP_OK);
        }

        $jsonProducts = $serializer->serialize($products, 'json', ['groups' => ['product:read']]);

        return new JsonResponse($jsonProducts, Response::HTTP_OK, [], true);
    }

    #[Route('/{id<\d+>}/upload-image', name: 'api_product_upload_image', methods: ['POST'])]
    public function uploadImage(Request $request, Product $product, FileStorageService $fileStorageService, EntityManagerInterface $entityManager): JsonResponse
    {
        $file = $request->files->get('file');

        if (!$file) {
            return new JsonResponse(['message' => 'No file uploaded'], Response::HTTP_BAD_REQUEST);
        }

        $serviceResponse = $fileStorageService->store($file);

        if (isset($serviceResponse['message'])) {
            return new JsonResponse(['message' => $serviceResponse['message']], $serviceResponse['code']);
        }

        $product->setImage($serviceResponse['fileName']);
        $entityManager->persist($product);
        $entityManager->flush();

        return new JsonResponse([
            'fileName' => $serviceResponse['fileName'],
            'message' => 'Image uploaded successfully'
        ], Response::HTTP_CREATED);
    }

    #[Route('/new', name: 'api_product_new', methods: ['POST'])]
    public function newApi(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('ADMIN_ACCESS');

        $data = json_decode($request->getContent(), true);
        $product = new Product();

        $form = $this->createForm(ProductType::class, $product);
        $form->submit($data);

        if ($form->isSubmitted() && !$form->isValid()) {
            $errorMessages = $this->productService->getFormErrors($form);

            return new JsonResponse(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($product);
        $entityManager->flush();

        return new JsonResponse(['message' => 'Product created successfully', 'id' => $product->getId()], Response::HTTP_CREATED);
    }

    #[Route('/{id<\d+>}', name: 'api_product_edit', methods: ['PUT'])]
    public function editApi(Request $request, Product $product, EntityManagerInterface $entityManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('ADMIN_ACCESS');

        if (!$product) {
            return new JsonResponse(['error' => 'Product not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $form = $this->createForm(ProductType::class, $product);
        $form->submit($data);

        if ($form->isSubmitted() && !$form->isValid()) {
            $errorMessages = $this->productService->getFormErrors($form);

            return new JsonResponse(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($product);
        $entityManager->flush();

        return new JsonResponse(['message' => 'Product updated successfully'], Response::HTTP_OK);
    }

    #[Route('/{id<\d+>}', name: 'api_product_patch', methods: ['PATCH'])]
    public function patchQuantity(Request $request, Product $product, EntityManagerInterface $entityManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('ADMIN_ACCESS');

        if (!$product) {
            return new JsonResponse(['error' => 'Product not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!isset($data['quantity']) || !is_numeric($data['quantity'])) {
            return new JsonResponse(['error' => 'Invalid or missing quantity'], Response::HTTP_BAD_REQUEST);
        }

        $addedQuantity = (int)$data['quantity'];
        $newQuantity = $product->getStockQuantity() + $addedQuantity;
        $product->setStockQuantity($newQuantity);

        $entityManager->persist($product);
        $entityManager->flush();

        return new JsonResponse([
            'message' => 'Quantity updated successfully',
            'addedQuantity' => $addedQuantity,
            'newQuantity' => $newQuantity
        ], Response::HTTP_OK);
    }

    #[Route('/{id<\d+>}', name: 'api_product_delete_restore', methods: ['DELETE'])]
    public function deleteOrRestoreApi(Request $request, Product $product, EntityManagerInterface $entityManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('ADMIN_ACCESS');

        if (!$product) {
            return new JsonResponse(['error' => 'Product not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['action']) && $data['action'] === 'delete') {
            $product->setDeletedAt(new \DateTimeImmutable());
            $entityManager->flush();

            return new JsonResponse(['message' => 'Product deleted successfully'], Response::HTTP_OK);
        } elseif (isset($data['action']) && $data['action'] === 'restore') {
            $product->setDeletedAt(null);
            $entityManager->flush();

            return new JsonResponse(['message' => 'Product restored successfully'], Response::HTTP_OK);
        }

        return new JsonResponse(['error' => 'Invalid action'], Response::HTTP_BAD_REQUEST);
    }
}