<?php

namespace App\Form;

use App\Entity\Category;
use App\Entity\Product;

use App\Repository\CategoryRepository;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\MoneyType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\Count;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Constraints\Regex;
use Symfony\Component\Validator\Constraints\Length;


class ProductType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name', TextType::class, [
                'constraints' => [
                    new NotBlank(['message' => 'Please enter a name.']),
                    new Length([
                        'min' => 2,
                        'maxMessage' => 'The name cannot be less than 2 characters.',
                    ]),
                ]
            ])
            ->add('price', MoneyType::class, [
                'currency' => 'USD',
                'scale' => 2,
                'constraints' => [
                    new NotBlank([
                        'message' => 'Please enter the price.'
                    ]),
                    new Regex([
                        'pattern' => '/^\d{1,8}(\.\d{2})?$/',
                        'message' => 'The price must be in the format 00.00 and cannot exceed 8 digits before the decimal point.'
                    ])
                ],
                'attr' => [
                    'step' => '0.01',
                    'min' => '0.00',
                    'max' => '99999999.99',
                ]
            ])
            ->add('description', TextType::class, [
                'constraints' => [
                    new Length([
                        'max' => 1000,
                        'maxMessage' => 'The description cannot exceed {{ limit }} characters.',
                    ]),
                ]
            ])


            ->add('categories', EntityType::class, [
                'class' => Category::class,
                'choice_label' => 'name',
                'multiple' => true,
                'expanded' => true,
                'label'=> 'Categories',
                'attr' => ['class' => 'form-control'],
                'constraints' => [
                    new Count([
                        'min' => 1,
                        'minMessage' => 'Please select at least one category.',
                    ]),
                ],
                'query_builder' => function (CategoryRepository $categoryRepository) {
                return $categoryRepository->createQueryBuilder('c')
                    ->andWhere('c.deletedAt IS NULL');
                }
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Product::class,
            'csrf_protection' => false,
        ]);
    }
}
