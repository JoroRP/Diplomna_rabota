<?php

namespace App\Service;

use App\Entity\Product;
use App\Repository\ProductRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ProductService
{
    private ProductRepository $productRepository;
    private ProductStockHistoryService $productStockHistoryService;
    private EntityManagerInterface $entityManager;

    public function __construct(ProductRepository $productRepository, ProductStockHistoryService $productStockHistoryService, EntityManagerInterface $entityManager)
    {
        $this->productRepository = $productRepository;
        $this->productStockHistoryService = $productStockHistoryService;
        $this->entityManager = $entityManager;
    }

    public function getProductById(int $id): Product
    {
        $product = $this->productRepository->findById($id);

        if (!$product) {
            throw new NotFoundHttpException("Product with ID $id not found.");
        }

        return $product;
    }

    public function getRandomProducts(int $limit): array
    {
        return $this->productRepository->findRandomProducts($limit);
    }

    public function getFilteredAndOrderedProducts(array $criteria, array $orderBy, ?string $search = null, int $page, int $itemsPerPage): array
    {
        return $this->productRepository->findByCriteriaAndOrder($criteria, $orderBy, $search, $page, $itemsPerPage);
    }

    public function getAvailableProductsToAddToOrder(array $criteria, array $orderBy): array
    {
        return $this->productRepository->findAvailableProductsToAddToOrder($criteria, $orderBy);
    }

    public function getFormErrors(FormInterface $form): array
    {
        $errors = [];

        foreach ($form->getErrors(true) as $error) {
            $propertyPath = $error->getOrigin()->getName();
            $errors[$propertyPath][] = $error->getMessage();
        }

        return $errors;
    }


}