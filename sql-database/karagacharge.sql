-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Nov 17, 2025 at 01:11 PM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kargacharge`
--

-- --------------------------------------------------------

--
-- Table structure for table `booking`
--

DROP TABLE IF EXISTS `booking`;
CREATE TABLE IF NOT EXISTS `booking` (
  `book_id` int NOT NULL AUTO_INCREMENT,
  `time_in` int NOT NULL,
  `time_out` int NOT NULL,
  `date` date NOT NULL,
  `evown_id` int NOT NULL,
  `rate` double NOT NULL,
  `status` varchar(50) DEFAULT NULL,
  `stat_id` int DEFAULT NULL,
  PRIMARY KEY (`book_id`),
  KEY `fk_evown_id` (`evown_id`),
  KEY `fk_stat_id` (`stat_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `booking`
--

INSERT INTO `booking` (`book_id`, `time_in`, `time_out`, `date`, `evown_id`, `rate`, `status`, `stat_id`) VALUES
(1, 1000, 1100, '2025-10-08', 345671, 20, 'Completed', 3),
(2, 900, 1000, '2025-11-18', 345671, 18.5, 'Completed', 1),
(3, 1030, 1200, '2025-11-18', 735183, 12, 'Completed', 2),
(4, 1300, 1430, '2025-11-18', 5047020, 20, 'Pending', 3);

-- --------------------------------------------------------

--
-- Table structure for table `charging_provider`
--

DROP TABLE IF EXISTS `charging_provider`;
CREATE TABLE IF NOT EXISTS `charging_provider` (
  `id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `phoneno` varchar(25) NOT NULL,
  `name` varchar(300) NOT NULL,
  `verification_code` int NOT NULL,
  `is_verified` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `charging_provider`
--

INSERT INTO `charging_provider` (`id`, `email`, `password_hash`, `phoneno`, `name`, `verification_code`, `is_verified`) VALUES
(2564089, 'markangelodomalanta05@gmail.com', '$2y$12$5uafh5mxOC/UpamlAHv76OXZ72fKpjCxqG99rF8koSv/lTi/3fV/6', '+639279126180', 'MARK ANGELO DOMALANTA', 429055, 1),
(7736903, 'fleargamata@gmail.com', '$2y$12$5uafh5mxOC/UpamlAHv76OXZ72fKpjCxqG99rF8koSv/lTi/3fV/6', '+639279126180', 'Flear', 453574, 1),
(9168225, 'layatchrysander5@gmail.com', '$2y$12$5uafh5mxOC/UpamlAHv76OXZ72fKpjCxqG99rF8koSv/lTi/3fV/6', '+639123456789', 'CHRYSANDER LAY-AT', 365012, 1);

-- --------------------------------------------------------

--
-- Table structure for table `charging_station`
--

DROP TABLE IF EXISTS `charging_station`;
CREATE TABLE IF NOT EXISTS `charging_station` (
  `stat_id` int NOT NULL AUTO_INCREMENT,
  `location` varchar(255) NOT NULL,
  `place_type` varchar(255) NOT NULL,
  `charge_type` varchar(255) NOT NULL,
  `rate` double NOT NULL,
  `availability_status` varchar(255) NOT NULL,
  `details` text NOT NULL,
  `prov_id` int NOT NULL,
  `stat_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`stat_id`),
  KEY `fk_provider` (`prov_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `charging_station`
--

INSERT INTO `charging_station` (`stat_id`, `location`, `place_type`, `charge_type`, `rate`, `availability_status`, `details`, `prov_id`, `stat_name`) VALUES
(1, 'Bakakeng, Bareng Drive', 'Homeowner', 'Outlet', 18.5, 'Available', 'Beside Carwash', 2564089, 'Mark EV Station'),
(2, 'Baguio, Kisad rd', 'Business Est.', 'Charging station', 12, 'Available', 'Coffee Shop & EV Chrging Station, Beside Crown Legacy', 7736903, 'Coffe&Charge Hub'),
(3, 'Camp7,Baguio Benguet, Bonifacio St.', 'Homeowner', 'Charging station', 20, 'Occupied', 'Front of Soleo Inn, Beside Total gas station', 9168225, 'The Charger Bay');

-- --------------------------------------------------------

--
-- Table structure for table `ev_owner`
--

DROP TABLE IF EXISTS `ev_owner`;
CREATE TABLE IF NOT EXISTS `ev_owner` (
  `id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `phoneno` varchar(25) NOT NULL,
  `name` varchar(300) NOT NULL,
  `verification_code` int NOT NULL,
  `is_verified` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ev_owner`
--

INSERT INTO `ev_owner` (`id`, `email`, `password_hash`, `phoneno`, `name`, `verification_code`, `is_verified`) VALUES
(345671, 'zyrusmasaad@gmail.com', '$2y$12$5uafh5mxOC/UpamlAHv76OXZ72fKpjCxqG99rF8koSv/lTi/3fV/6', '09876543218', 'Zyrus Masa-ad', 345683, 1),
(735183, 'zysam2005@gmail.com', '$2y$12$5uafh5mxOC/UpamlAHv76OXZ72fKpjCxqG99rF8koSv/lTi/3fV/6', '0954628173', 'Zy', 827451, 1),
(5047020, 'domalantamarkangelo@gmail.com', '$2y$12$5uafh5mxOC/UpamlAHv76OXZ72fKpjCxqG99rF8koSv/lTi/3fV/6', '+639279126180', 'MARK ANGELO DOMALANTA', 902295, 1);

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
CREATE TABLE IF NOT EXISTS `payment` (
  `pay_id` int NOT NULL AUTO_INCREMENT,
  `total_amount` double NOT NULL,
  `payment_method` varchar(55) NOT NULL,
  `payment_status` varchar(55) NOT NULL,
  `book_id` int NOT NULL,
  PRIMARY KEY (`pay_id`),
  KEY `fk_book_id` (`book_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`pay_id`, `total_amount`, `payment_method`, `payment_status`, `book_id`) VALUES
(2, 185, 'GCash', 'Paid', 2),
(3, 240, 'Cash', 'Paid', 3),
(4, 300, 'GCash', 'Pending', 4),
(5, 200, 'GCash', 'Paid', 1);

-- --------------------------------------------------------

--
-- Table structure for table `review`
--

DROP TABLE IF EXISTS `review`;
CREATE TABLE IF NOT EXISTS `review` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `rating` int NOT NULL,
  `comment` text NOT NULL,
  `pay_id` int NOT NULL,
  PRIMARY KEY (`review_id`),
  KEY `fk_pay_id` (`pay_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `review`
--

INSERT INTO `review` (`review_id`, `rating`, `comment`, `pay_id`) VALUES
(1, 5, 'Fast and convenient charging!', 2),
(2, 4, 'Good location but could add more charging bays.', 3),
(3, 5, 'Very helpful provider!', 4);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `booking`
--
ALTER TABLE `booking`
  ADD CONSTRAINT `fk_evown_id` FOREIGN KEY (`evown_id`) REFERENCES `ev_owner` (`id`),
  ADD CONSTRAINT `fk_stat_id` FOREIGN KEY (`stat_id`) REFERENCES `charging_station` (`stat_id`);

--
-- Constraints for table `charging_station`
--
ALTER TABLE `charging_station`
  ADD CONSTRAINT `fk_provider` FOREIGN KEY (`prov_id`) REFERENCES `charging_provider` (`id`);

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `fk_book_id` FOREIGN KEY (`book_id`) REFERENCES `booking` (`book_id`);

--
-- Constraints for table `review`
--
ALTER TABLE `review`
  ADD CONSTRAINT `fk_pay_id` FOREIGN KEY (`pay_id`) REFERENCES `payment` (`pay_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
