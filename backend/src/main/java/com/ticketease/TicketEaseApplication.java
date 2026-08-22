package com.ticketease;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * TicketEase - Smart Ticket Booking & Management Platform.
 *
 * Entry point for the Spring Boot backend application.
 *
 * Scheduling is enabled for background jobs (expired seat hold cleanup,
 * notification retries, booking reminders, calendar sync retries).
 *
 * Async is enabled so that external side effects (email, calendar sync)
 * never block the main booking transaction.
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync
public class TicketEaseApplication {

    public static void main(String[] args) {
        SpringApplication.run(TicketEaseApplication.class, args);
    }
}
