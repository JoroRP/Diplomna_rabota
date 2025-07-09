<?php

namespace App\Entity;

use App\Enum\OrderStatus;
use App\Repository\OrderRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: OrderRepository::class)]
#[ORM\Table(name: 'orders')]
class Order
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['order:read'])]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['order:read'])]
    private ?\DateTimeInterface $orderDate = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['order:read'])]
    private ?string $totalAmount = null;

    #[ORM\Column(length: 50)]
    #[Groups(['order:read'])]
    private ?string $paymentMethod = null;

    #[ORM\Column(type: 'string', enumType: OrderStatus::class)]
    #[Groups(['order:read'])]
    private OrderStatus $status;

    #[ORM\Column(nullable: true)]
    #[Groups(['order:read'])]
    private ?\DateTimeImmutable $deletedAt = null;

    #[ORM\ManyToOne(inversedBy: 'orders')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['order:read'])]
    private ?User $users = null;

    /**
     * @var Collection<int, OrderProduct>
     */
    #[ORM\OneToMany(targetEntity: OrderProduct::class, mappedBy: 'orderEntity', cascade: ['persist', 'remove'])]
    #[Groups(['order:read'])]
    private Collection $orderProducts;

    #[ORM\OneToOne(mappedBy: 'orderEntity', cascade: ['persist', 'remove'])]
    #[Groups(['order:read'])]
    private ?Address $address = null;

    /**
     * @var Collection<int, OrderHistoryLogs>
     */
    #[ORM\OneToMany(targetEntity: OrderHistoryLogs::class, mappedBy: 'relatedOrder')]
    private Collection $orderHistoryLogs;

    public function __construct()
    {
        $this->orderProducts = new ArrayCollection();
        $this->orderHistoryLogs = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getOrderDate(): ?\DateTimeInterface
    {
        return $this->orderDate;
    }

    public function setOrderDate(\DateTimeInterface $orderDate): static
    {
        $this->orderDate = $orderDate;

        return $this;
    }

    public function getTotalAmount(): ?string
    {
        return $this->totalAmount;
    }

    public function setTotalAmount(string $totalAmount): static
    {
        $this->totalAmount = $totalAmount;

        return $this;
    }

    public function getPaymentMethod(): ?string
    {
        return $this->paymentMethod;
    }

    public function setPaymentMethod(string $paymentMethod): static
    {
        $this->paymentMethod = $paymentMethod;

        return $this;
    }

    public function getStatus(): OrderStatus
    {
        return $this->status;
    }

    public function setStatus(OrderStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getDeletedAt(): ?\DateTimeImmutable
    {
        return $this->deletedAt;
    }

    public function setDeletedAt(?\DateTimeImmutable $deletedAt): static
    {
        $this->deletedAt = $deletedAt;

        return $this;
    }

    public function getUserId(): ?User
    {
        return $this->users;
    }

    public function setUserId(?User $users): static
    {
        $this->users = $users;

        return $this;
    }

    /**
     * @return Collection<int, OrderProduct>
     */
    public function getOrderProducts(): Collection
    {
        return $this->orderProducts;
    }

    public function addOrderProduct(OrderProduct $orderProduct): static
    {
        if (!$this->orderProducts->contains($orderProduct)) {
            $this->orderProducts->add($orderProduct);
            $orderProduct->setOrderEntity($this);
        }

        return $this;
    }

    public function removeOrderProduct(OrderProduct $orderProduct): static
    {
        if ($this->orderProducts->removeElement($orderProduct)) {
            if ($orderProduct->getOrderEntity() === $this) {
                $orderProduct->setOrderEntity(null);
            }
        }

        return $this;
    }

    public function getAddress(): ?Address
    {
        return $this->address;
    }

    public function setAddress(?Address $address): static
    {
        if ($address === null && $this->address !== null) {
            $this->address->setOrderEntity(null);
        }

        if ($address !== null && $address->getOrderEntity() !== $this) {
            $address->setOrderEntity($this);
        }

        $this->address = $address;

        return $this;
    }

    /**
     * @return Collection<int, OrderHistoryLogs>
     */
    public function getOrderHistoryLogs(): Collection
    {
        return $this->orderHistoryLogs;
    }

    public function addOrderHistoryLog(OrderHistoryLogs $orderHistoryLog): static
    {
        if (!$this->orderHistoryLogs->contains($orderHistoryLog)) {
            $this->orderHistoryLogs->add($orderHistoryLog);
            $orderHistoryLog->setRelatedOrder($this);
        }

        return $this;
    }

    public function removeOrderHistoryLog(OrderHistoryLogs $orderHistoryLog): static
    {
        if ($this->orderHistoryLogs->removeElement($orderHistoryLog)) {
            if ($orderHistoryLog->getRelatedOrder() === $this) {
                $orderHistoryLog->setRelatedOrder(null);
            }
        }

        return $this;
    }
}


