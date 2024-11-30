package com.example.transaction_locking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TransactionLockingApplication {

	public static void main(String[] args) {
		SpringApplication.run(TransactionLockingApplication.class, args);
		System.out.println("Transaction Locking Application Started");
	}

}
