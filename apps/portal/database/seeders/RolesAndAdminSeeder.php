<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolesAndAdminSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'requester'   => 'Requester',
            'bu_leader'   => 'Business Unit Leader',
            'reviewer'    => 'Reviewer',
            'it_helpdesk' => 'IT / Helpdesk',
            'admin'       => 'Administrator',
        ];

        foreach ($roles as $name => $label) {
            Role::firstOrCreate(['name' => $name], ['label' => $label]);
        }

        // First admin — change the password immediately after first login.
        $admin = User::firstOrCreate(
            ['username' => 'admin'],
            [
                'name'     => 'System Admin',
                'email'    => 'it@nortonlilly.com',
                'password' => Hash::make('ChangeMe!'.bin2hex(random_bytes(4))),
                'active'   => true,
            ]
        );
        $admin->roles()->syncWithoutDetaching(Role::where('name', 'admin')->pluck('id'));

        // Example: seed Megan as a Reviewer once her user exists.
        // User::where('email','mmcdaniel@nortonlilly.com')->first()
        //     ?->roles()->syncWithoutDetaching(Role::where('name','reviewer')->pluck('id'));
    }
}
