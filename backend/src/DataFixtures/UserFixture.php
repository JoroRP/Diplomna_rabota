<?php

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class UserFixture extends Fixture
{
    public function load(ObjectManager $manager): void
    {

        $user = new User();
        $user->setFirstName('Georgi');
        $user->setLastName('Protopopov');
        $user->setEmail('user@gmail.com');
        $user->setRoles(['ROLE_USER']);
        $user->setPassword(password_hash('123', PASSWORD_DEFAULT));
        $this->addReference('user', $user);
        $manager->persist($user);

        $user2 = new User();
        $user2->setFirstName('Admin');
        $user2->setLastName('Protopopov');
        $user2->setEmail('admin@gmail.com');
        $user2->setRoles(['ROLE_ADMIN']);
        $user2->setPassword(password_hash('123', PASSWORD_DEFAULT));
        $this->addReference('user2', $user2);
        $manager->persist($user2);


        $manager->flush();
    }

}
