package br.com.mgctecnologia.siae.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SiaeApplication {

	public static void main(String[] args) {
		SpringApplication.run(SiaeApplication.class, args);
	}

}
