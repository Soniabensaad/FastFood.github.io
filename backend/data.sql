CREATE DATABASE fast;

CREATE TABLE fastfood (
    id BIGSERIAL NOT NULL  PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    location VARCHAR (50) NOT NULL,
    email VARCHAR(255),
    price_range INT
);

CREATE TABLE reviews(
    id BIGSERIAL NOT NULL PRIMARY KEY,
    fastfood_id INTEGER REFERENCES fastfood(id),
    name VARCHAR(50) NOT NULL,
    review TEXT NOT NULL,
    rating INT  NOT NULL check(rating >=1 and rating <=5)
);

CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    hashed_password VARCHAR(255)
);
