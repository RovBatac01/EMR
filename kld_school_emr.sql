-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 01, 2026 at 02:08 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kld_school_emr`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `actor_user_id` char(36) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(80) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `description` varchar(2000) NOT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `request_method` varchar(10) DEFAULT NULL,
  `request_path` varchar(500) DEFAULT NULL,
  `request_id` varchar(100) DEFAULT NULL,
  `metadata` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `description`, `ip_address`, `request_method`, `request_path`, `request_id`, `metadata`, `created_at`) VALUES
(116, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 07:41:58'),
(117, 'a393f297-d394-4520-af95-18083bf32a3d', 'CREATE_PATIENT', 'students', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Registered student 2023-5-001659.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 07:43:53'),
(118, 'a393f297-d394-4520-af95-18083bf32a3d', 'VIEW_PATIENT', 'students', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Viewed medical profile for 2023-5-001659.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 07:43:53'),
(119, 'a393f297-d394-4520-af95-18083bf32a3d', 'VIEW_PATIENT', 'students', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Viewed medical profile for 2023-5-001659.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 07:43:53'),
(120, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 07:43:58'),
(121, NULL, 'LOGIN_FAILED', NULL, NULL, 'Unsuccessful login attempt.', '::1', NULL, NULL, NULL, '{\"identifier\":\"admin\"}', '2026-10-31 07:45:46'),
(122, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 07:45:57'),
(123, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 07:47:16'),
(124, NULL, 'STUDENT_ACTIVATION_REQUESTED', 'students', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Student portal activation requested.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 07:47:45'),
(125, NULL, 'LOGIN_FAILED', NULL, NULL, 'Unsuccessful login attempt.', '::1', NULL, NULL, NULL, '{\"identifier\":\"dacpalustre@kld.edu.ph\"}', '2026-10-31 07:48:30'),
(126, NULL, 'LOGIN_FAILED', NULL, NULL, 'Unsuccessful login attempt.', '::1', NULL, NULL, NULL, '{\"identifier\":\"dacpalustre@kld.edu.ph\"}', '2026-10-31 07:51:37'),
(127, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 07:52:52'),
(128, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 07:54:09'),
(129, NULL, 'STUDENT_ACTIVATION_REQUESTED', 'students', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Student portal activation requested.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 08:17:49'),
(130, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'STUDENT_ACCOUNT_ACTIVATED', 'students', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Student clinic portal account activated.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 08:18:29'),
(131, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'LOGIN', 'users', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', ' signed in.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 08:18:41'),
(132, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'LOGOUT', 'users', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'dacpalustre signed out.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 08:18:44'),
(133, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'LOGIN', 'users', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', ' signed in.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 08:18:54'),
(134, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'LOGOUT', 'users', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'dacpalustre signed out.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 08:18:57'),
(135, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'LOGIN', 'users', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', ' signed in.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 08:21:19'),
(136, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'LOGOUT', 'users', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'dacpalustre signed out.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 08:21:43'),
(137, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 08:38:08'),
(138, 'a393f297-d394-4520-af95-18083bf32a3d', 'CREATE_VISIT', 'visits', '2fa537c4-520e-4a58-a2fa-ca257d9dd02d', 'Registered visit VIS-20261031-P4ODSV for 2023-5-001659.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 08:40:05'),
(139, 'a393f297-d394-4520-af95-18083bf32a3d', 'UPDATE_VISIT', 'visits', '2fa537c4-520e-4a58-a2fa-ca257d9dd02d', 'Updated clinic visit.', '::1', NULL, NULL, NULL, '{\"fields\":[\"studentId\",\"visitDate\",\"visitTime\",\"visitType\",\"reason\",\"complaint\",\"accompaniedBy\",\"priority\",\"notes\",\"status\"]}', '2026-10-31 09:20:48'),
(140, 'a393f297-d394-4520-af95-18083bf32a3d', 'CREATE_CONSULTATION', 'consultations', '63c25f32-8621-4af6-a23b-92e281b99a2b', 'Created consultation CON-20261031-266CB5.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 09:21:50'),
(141, 'a393f297-d394-4520-af95-18083bf32a3d', 'UPDATE_CONSULTATION', 'consultations', '63c25f32-8621-4af6-a23b-92e281b99a2b', 'Updated consultation record.', '::1', NULL, NULL, NULL, '{\"fields\":[\"visitId\",\"chiefComplaint\",\"symptoms\",\"diagnosis\",\"findings\",\"severity\",\"treatmentProvided\",\"dosage\",\"frequency\",\"duration\",\"recommendations\",\"notes\",\"status\",\"vitalSigns\",\"physicalAssessment\",\"revisionReason\"]}', '2026-10-31 09:22:15'),
(142, 'a393f297-d394-4520-af95-18083bf32a3d', 'UPDATE_VISIT', 'visits', '2fa537c4-520e-4a58-a2fa-ca257d9dd02d', 'Updated clinic visit.', '::1', NULL, NULL, NULL, '{\"fields\":[\"studentId\",\"visitDate\",\"visitTime\",\"visitType\",\"reason\",\"complaint\",\"accompaniedBy\",\"priority\",\"notes\",\"status\"]}', '2026-10-31 09:22:54'),
(143, 'a393f297-d394-4520-af95-18083bf32a3d', 'UPDATE_VISIT', 'visits', '2fa537c4-520e-4a58-a2fa-ca257d9dd02d', 'Updated clinic visit.', '::1', NULL, NULL, NULL, '{\"fields\":[\"studentId\",\"visitDate\",\"visitTime\",\"visitType\",\"reason\",\"complaint\",\"accompaniedBy\",\"priority\",\"notes\",\"status\"]}', '2026-10-31 09:24:44'),
(144, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 09:35:10'),
(145, NULL, 'LOGIN_FAILED', NULL, NULL, 'Unsuccessful login attempt.', '::1', NULL, NULL, NULL, '{\"identifier\":\"admin\"}', '2026-10-31 12:19:01'),
(146, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 12:19:07'),
(147, 'a393f297-d394-4520-af95-18083bf32a3d', 'CREATE_PATIENT', 'students', 'aa12ddbe-78d9-412b-b833-9024e386a3df', 'Registered student 123456789.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 12:34:03'),
(148, 'a393f297-d394-4520-af95-18083bf32a3d', 'VIEW_PATIENT', 'students', 'aa12ddbe-78d9-412b-b833-9024e386a3df', 'Viewed medical profile for 123456789.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 12:34:03'),
(149, 'a393f297-d394-4520-af95-18083bf32a3d', 'VIEW_PATIENT', 'students', 'aa12ddbe-78d9-412b-b833-9024e386a3df', 'Viewed medical profile for 123456789.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 12:34:03'),
(150, 'a393f297-d394-4520-af95-18083bf32a3d', 'DELETE_PATIENT', 'students', 'aa12ddbe-78d9-412b-b833-9024e386a3df', 'Deleted unused student 123456789.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 12:34:21'),
(151, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 12:38:13'),
(152, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 12:40:00'),
(153, 'a393f297-d394-4520-af95-18083bf32a3d', 'UPDATE_VISIT', 'visits', '2fa537c4-520e-4a58-a2fa-ca257d9dd02d', 'Updated clinic visit.', '::1', NULL, NULL, NULL, '{\"fields\":[\"studentId\",\"visitDate\",\"visitTime\",\"visitType\",\"reason\",\"complaint\",\"accompaniedBy\",\"priority\",\"notes\",\"status\"]}', '2026-10-31 12:40:53'),
(154, 'a393f297-d394-4520-af95-18083bf32a3d', 'VIEW_PATIENT', 'students', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Viewed medical profile for 2023-5-001659.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 12:40:56'),
(155, 'a393f297-d394-4520-af95-18083bf32a3d', 'VIEW_PATIENT', 'students', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Viewed medical profile for 2023-5-001659.', '::1', NULL, NULL, NULL, NULL, '2026-10-31 12:40:56'),
(156, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:02:22'),
(157, 'a393f297-d394-4520-af95-18083bf32a3d', 'VIEW_VISIT_RECORD', 'visits', '2fa537c4-520e-4a58-a2fa-ca257d9dd02d', 'Viewed clinic visit VIS-20261031-P4ODSV.', '::1', 'GET', '/api/visits/2fa537c4-520e-4a58-a2fa-ca257d9dd02d', 'b092913a-2569-4dc4-a7ac-913fef83cdc7', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\"}', '2026-11-01 04:05:03'),
(158, 'a393f297-d394-4520-af95-18083bf32a3d', 'VIEW_VISIT_RECORD', 'visits', '2fa537c4-520e-4a58-a2fa-ca257d9dd02d', 'Viewed clinic visit VIS-20261031-P4ODSV.', '::1', 'GET', '/api/visits/2fa537c4-520e-4a58-a2fa-ca257d9dd02d', 'f2331824-6d2e-4d57-a16f-ac8b3903631b', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\"}', '2026-11-01 04:05:03'),
(159, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:06:10'),
(160, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'LOGIN', 'users', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', ' signed in.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:06:45'),
(161, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'VIEW_OWN_MEDICAL_PROFILE', 'patients', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Viewed own student medical profile.', '::1', 'GET', '/api/student-portal/profile', '51e70245-02d7-4904-9c19-8a1ab2e026cb', NULL, '2026-11-01 04:06:46'),
(162, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'VIEW_OWN_MEDICAL_PROFILE', 'patients', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Viewed own student medical profile.', '::1', 'GET', '/api/student-portal/profile', '4f36a6c2-3eba-4e3e-8f61-4579f373e248', NULL, '2026-11-01 04:06:46'),
(163, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'VIEW_OWN_MEDICAL_PROFILE', 'patients', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Viewed own student medical profile.', '::1', 'GET', '/api/student-portal/profile', '692fee3e-7bd2-4a28-b150-c953c0690a12', NULL, '2026-11-01 04:07:02'),
(164, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'VIEW_OWN_MEDICAL_PROFILE', 'patients', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Viewed own student medical profile.', '::1', 'GET', '/api/student-portal/profile', '6a5bb54f-1319-4e5f-8769-020cb548c0a7', NULL, '2026-11-01 04:07:02'),
(165, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'LOGOUT', 'users', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'dacpalustre signed out.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:07:12'),
(166, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:07:20'),
(167, 'a393f297-d394-4520-af95-18083bf32a3d', 'ADD_MEDICINE', 'medicines', '77a44cda-b4b4-420c-92c4-89e0bfe7c44a', 'Added medicine meow.', '::1', 'POST', '/api/medicines', '5ecaca92-c060-4cc2-b1a5-33da83e0e695', NULL, '2026-11-01 04:16:31'),
(168, 'a393f297-d394-4520-af95-18083bf32a3d', 'UPDATE_MEDICINE', 'medicines', '77a44cda-b4b4-420c-92c4-89e0bfe7c44a', 'Updated medicine information.', '::1', 'PATCH', '/api/medicines/77a44cda-b4b4-420c-92c4-89e0bfe7c44a', 'd53a073d-a371-45bd-8b83-ac565e9359db', '{\"fields\":[\"medicineCode\",\"genericName\",\"brandName\",\"categoryId\",\"categoryName\",\"dosageForm\",\"unit\",\"minimumStock\",\"supplier\",\"storageLocation\",\"isActive\"]}', '2026-11-01 04:16:56'),
(169, 'a393f297-d394-4520-af95-18083bf32a3d', 'OPEN_STOCK_COUNT', 'stock_count_sessions', '2c0e8d02-b38e-49a3-8ad5-b55f7869c139', 'Opened stock count CNT-20261101-5V4V23 with 0 batches.', '::1', 'POST', '/api/inventory-control/stock-counts', '137ebf67-e74e-43ec-8112-87641ca392f6', NULL, '2026-11-01 04:17:24'),
(170, 'a393f297-d394-4520-af95-18083bf32a3d', 'RECEIVE_MEDICINE_STOCK', 'medicine_batches', 'c1061dd2-5b86-4d74-844c-e577fa91caf2', 'Received 9 units of meow.', '::1', 'POST', '/api/medicines/77a44cda-b4b4-420c-92c4-89e0bfe7c44a/batches', 'ad36204a-568c-46bd-b08b-9deab5c0d9bf', NULL, '2026-11-01 04:18:43'),
(171, 'a393f297-d394-4520-af95-18083bf32a3d', 'ADD_MEDICINE', 'medicines', 'a39e7f22-a825-497d-afee-23adae4be1bf', 'Added medicine Paracetamol.', '::1', 'POST', '/api/medicines', '27be30ce-7ef0-43ea-9c64-592a3c13d816', NULL, '2026-11-01 04:20:42'),
(172, 'a393f297-d394-4520-af95-18083bf32a3d', 'RECEIVE_MEDICINE_STOCK', 'medicine_batches', '0fad9a47-276b-414e-997e-3f414bee82d6', 'Received 100 units of Paracetamol.', '::1', 'POST', '/api/medicines/a39e7f22-a825-497d-afee-23adae4be1bf/batches', '2a19ddd4-59bf-4d50-9f3c-6736bdb9c6d7', NULL, '2026-11-01 04:21:17'),
(173, 'a393f297-d394-4520-af95-18083bf32a3d', 'DEACTIVATE_MEDICINE_CATEGORY', 'medicine_categories', '31e6e139-3a0a-4b87-80fd-87226f64797e', 'Deactivated a medicine category without changing existing medicine records.', '::1', 'DELETE', '/api/medicines/categories/31e6e139-3a0a-4b87-80fd-87226f64797e', '7af7f779-01af-4dc9-88f8-f154d90e106d', NULL, '2026-11-01 04:21:45'),
(174, 'a393f297-d394-4520-af95-18083bf32a3d', 'UPDATE_MEDICINE_CATEGORY', 'medicine_categories', '31e6e139-3a0a-4b87-80fd-87226f64797e', 'Updated a medicine category.', '::1', 'PATCH', '/api/medicines/categories/31e6e139-3a0a-4b87-80fd-87226f64797e', 'f5a662e4-cf0c-4315-a611-d7234821ccea', '{\"fields\":[\"name\",\"description\",\"isActive\"]}', '2026-11-01 04:21:55'),
(175, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:23:20'),
(176, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'LOGIN', 'users', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', ' signed in.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:24:06'),
(177, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'CREATE_APPOINTMENT', 'appointments', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', 'Requested appointment APT-20261101-ND6OIJ for 2023-5-001659.', '::1', 'POST', '/api/appointments', 'f7d3e72e-629b-40f2-bff2-635c53b01a48', NULL, '2026-11-01 04:24:42'),
(178, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'LOGOUT', 'users', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'dacpalustre signed out.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:24:50'),
(179, NULL, 'LOGIN_FAILED', NULL, NULL, 'Unsuccessful login attempt.', '::1', NULL, NULL, NULL, '{\"identifier\":\"admin\"}', '2026-11-01 04:24:55'),
(180, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:25:02'),
(181, 'a393f297-d394-4520-af95-18083bf32a3d', 'APPOINTMENT_CONFIRMED', 'appointments', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', 'Appointment confirmed. APT-20261101-ND6OIJ', '::1', 'PATCH', '/api/appointments/e05f7941-ff24-4b0e-9edc-03ae74b01d07/status', '1814ccbb-bd2b-4360-bcd5-11aca7e3365e', NULL, '2026-11-01 04:25:37'),
(182, 'a393f297-d394-4520-af95-18083bf32a3d', 'APPOINTMENT_CHECK_IN', 'appointments', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', 'Checked in APT-20261101-ND6OIJ as queue 1.', '::1', 'POST', '/api/appointments/e05f7941-ff24-4b0e-9edc-03ae74b01d07/check-in', '345d4741-5ef6-4034-a477-0a8de803889a', NULL, '2026-11-01 04:26:48'),
(183, 'a393f297-d394-4520-af95-18083bf32a3d', 'QUEUE_CALLED', 'clinic_queue_entries', '5d00a9e7-ed7c-455c-a7ad-d0fdae2acc11', 'Changed queue 1 to CALLED.', '::1', 'PATCH', '/api/queue/5d00a9e7-ed7c-455c-a7ad-d0fdae2acc11/status', 'a1d572c7-d31a-4bb7-b6ad-74e774ca4d22', '{\"from\":\"WAITING\",\"to\":\"CALLED\"}', '2026-11-01 04:27:00'),
(184, 'a393f297-d394-4520-af95-18083bf32a3d', 'CREATE_STAFF', 'staff', 'c37c2b24-5eb3-4438-a0f8-c48ebd12b88e', 'Created doctor account doctor.', '::1', 'POST', '/api/staff', 'f0a2d131-3d0c-4e3a-9126-acf88033f8ae', NULL, '2026-11-01 04:30:00'),
(185, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:30:04'),
(186, '32be3719-9891-4392-b896-62a9e369c7be', 'LOGIN', 'users', '32be3719-9891-4392-b896-62a9e369c7be', 'Head Doctor signed in.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:30:13'),
(187, '32be3719-9891-4392-b896-62a9e369c7be', 'CHANGE_PASSWORD', 'users', '32be3719-9891-4392-b896-62a9e369c7be', 'Account password changed.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:30:40'),
(188, '32be3719-9891-4392-b896-62a9e369c7be', 'QUEUE_IN_CONSULTATION', 'clinic_queue_entries', '5d00a9e7-ed7c-455c-a7ad-d0fdae2acc11', 'Changed queue 1 to IN_CONSULTATION.', '::1', 'PATCH', '/api/queue/5d00a9e7-ed7c-455c-a7ad-d0fdae2acc11/status', 'afd66100-c7e1-45ca-bf10-4ac9749b9b2d', '{\"from\":\"CALLED\",\"to\":\"IN_CONSULTATION\"}', '2026-11-01 04:31:09'),
(189, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_VISIT_RECORD', 'visits', 'bf5e6164-c904-4820-b3ea-210bc3d72434', 'Viewed clinic visit VIS-20261101-2Q75NT.', '::1', 'GET', '/api/visits/bf5e6164-c904-4820-b3ea-210bc3d72434', '3dd65ede-8946-445b-936d-ab372301f8f8', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\"}', '2026-11-01 04:31:22'),
(190, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_VISIT_RECORD', 'visits', 'bf5e6164-c904-4820-b3ea-210bc3d72434', 'Viewed clinic visit VIS-20261101-2Q75NT.', '::1', 'GET', '/api/visits/bf5e6164-c904-4820-b3ea-210bc3d72434', 'cfcbc9e5-3fb3-44d9-a95a-23d27f394787', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\"}', '2026-11-01 04:31:22'),
(191, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_VISIT_RECORD', 'visits', 'bf5e6164-c904-4820-b3ea-210bc3d72434', 'Viewed clinic visit VIS-20261101-2Q75NT.', '::1', 'GET', '/api/visits/bf5e6164-c904-4820-b3ea-210bc3d72434', 'ceb3601c-2eb4-4736-982f-59a3742a2d30', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\"}', '2026-11-01 04:31:45'),
(192, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_VISIT_RECORD', 'visits', 'bf5e6164-c904-4820-b3ea-210bc3d72434', 'Viewed clinic visit VIS-20261101-2Q75NT.', '::1', 'GET', '/api/visits/bf5e6164-c904-4820-b3ea-210bc3d72434', '00e77cee-2342-4569-9749-3b0d1103b41c', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\"}', '2026-11-01 04:31:45'),
(193, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_VISIT_RECORD', 'visits', 'bf5e6164-c904-4820-b3ea-210bc3d72434', 'Viewed clinic visit VIS-20261101-2Q75NT.', '::1', 'GET', '/api/visits/bf5e6164-c904-4820-b3ea-210bc3d72434', '2ba84a88-3fd2-49b8-8ae1-a51dd4c3df62', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\"}', '2026-11-01 04:32:03'),
(194, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_VISIT_RECORD', 'visits', 'bf5e6164-c904-4820-b3ea-210bc3d72434', 'Viewed clinic visit VIS-20261101-2Q75NT.', '::1', 'GET', '/api/visits/bf5e6164-c904-4820-b3ea-210bc3d72434', '00c86508-9eda-484b-b6c1-22956a0c45f8', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\"}', '2026-11-01 04:32:03'),
(195, '32be3719-9891-4392-b896-62a9e369c7be', 'CREATE_CONSULTATION', 'consultations', 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'Created consultation CON-20261101-7UMPFJ.', '::1', 'POST', '/api/consultations', 'fcd37797-9448-4d1f-a91a-b1316be54898', NULL, '2026-11-01 04:32:47'),
(196, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_MEDICAL_RECORD', 'consultations', 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'Viewed consultation CON-20261101-7UMPFJ.', '::1', 'GET', '/api/consultations/c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', '6c346dd5-19d0-4a59-bf5d-708da5182362', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\",\"status\":\"DRAFT\"}', '2026-11-01 04:32:47'),
(197, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_MEDICAL_RECORD', 'consultations', 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'Viewed consultation CON-20261101-7UMPFJ.', '::1', 'GET', '/api/consultations/c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', '380d747c-f0c5-4538-933a-2114e783a68e', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\",\"status\":\"DRAFT\"}', '2026-11-01 04:32:47'),
(198, '32be3719-9891-4392-b896-62a9e369c7be', 'UPLOAD_MEDICAL_ATTACHMENT', 'medical_attachments', 'c52de0e2-3a24-4ea2-8a3d-1d43a07a7f0a', 'Uploaded an authorized medical attachment.', '::1', 'POST', '/api/attachments', 'b6171a92-e940-4e8a-8014-e3ad523f7460', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\",\"visitId\":null,\"consultationId\":\"c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb\",\"mimeType\":\"image/png\",\"fileSize\":1257977}', '2026-11-01 04:33:33'),
(199, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_MEDICAL_RECORD', 'consultations', 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'Viewed consultation CON-20261101-7UMPFJ.', '::1', 'GET', '/api/consultations/c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', '0890b5ae-73c9-44d7-b0d2-f2eb0e8dab0f', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\",\"status\":\"DRAFT\"}', '2026-11-01 04:33:33'),
(200, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_MEDICAL_RECORD', 'consultations', 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'Viewed consultation CON-20261101-7UMPFJ.', '::1', 'GET', '/api/consultations/c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', '6be75931-5ed5-48f7-8717-d0a9798b5177', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\",\"status\":\"DRAFT\"}', '2026-11-01 04:34:05'),
(201, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_MEDICAL_RECORD', 'consultations', 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'Viewed consultation CON-20261101-7UMPFJ.', '::1', 'GET', '/api/consultations/c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', '3c34894f-da45-45b1-8e63-e9608d625885', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\",\"status\":\"DRAFT\"}', '2026-11-01 04:34:05'),
(202, '32be3719-9891-4392-b896-62a9e369c7be', 'UPDATE_CONSULTATION', 'consultations', 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'Updated consultation draft.', '::1', 'PATCH', '/api/consultations/c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', '1e25c932-1f86-4b32-bfce-bc6f5633fac2', '{\"fields\":[\"visitId\",\"chiefComplaint\",\"symptoms\",\"diagnosis\",\"findings\",\"severity\",\"treatmentProvided\",\"dosage\",\"frequency\",\"duration\",\"recommendations\",\"notes\",\"status\",\"vitalSigns\",\"physicalAssessment\",\"revisionReason\"],\"revisionReason\":null}', '2026-11-01 04:34:26'),
(203, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_MEDICAL_RECORD', 'consultations', 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'Viewed consultation CON-20261101-7UMPFJ.', '::1', 'GET', '/api/consultations/c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', '71c828ef-edb7-434c-85cf-95bd55f62ab9', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\",\"status\":\"DRAFT\"}', '2026-11-01 04:34:26'),
(204, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_MEDICAL_RECORD', 'consultations', 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'Viewed consultation CON-20261101-7UMPFJ.', '::1', 'GET', '/api/consultations/c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', '8cf94277-9af9-4a3b-9aa7-5d2833f181f1', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\",\"status\":\"DRAFT\"}', '2026-11-01 04:34:26'),
(205, '32be3719-9891-4392-b896-62a9e369c7be', 'SIGN_OFF_CONSULTATION', 'consultations', 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'Doctor signed off consultation CON-20261101-7UMPFJ.', '::1', 'POST', '/api/consultations/c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb/sign-off', '1681ede3-69cd-4c22-8f60-8a159aa9015a', '{\"doctorStaffId\":\"c37c2b24-5eb3-4438-a0f8-c48ebd12b88e\"}', '2026-11-01 04:34:34'),
(206, '32be3719-9891-4392-b896-62a9e369c7be', 'VIEW_MEDICAL_RECORD', 'consultations', 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'Viewed consultation CON-20261101-7UMPFJ.', '::1', 'GET', '/api/consultations/c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'a1d3b7c8-bf6e-4609-85bc-39c17067df37', '{\"patientId\":\"9eb23708-59ef-4b37-a27f-0a3db5b91596\",\"status\":\"COMPLETED\"}', '2026-11-01 04:34:34'),
(207, '32be3719-9891-4392-b896-62a9e369c7be', 'LOGOUT', 'users', '32be3719-9891-4392-b896-62a9e369c7be', 'doctor signed out.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:35:00'),
(208, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:36:21'),
(209, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:37:01'),
(210, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 04:38:01'),
(211, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 07:33:03'),
(212, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 07:41:42'),
(213, 'a393f297-d394-4520-af95-18083bf32a3d', 'UPDATE_PUBLIC_LANDING', 'landing_page_config', '11111111-1111-4111-8111-111111111111', 'Updated the public clinic landing page.', '::1', 'PATCH', '/api/public/landing/admin/config', 'ea35b57d-9b0a-4b14-90ee-d3af6f117297', NULL, '2026-11-01 07:42:09'),
(214, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 07:42:13'),
(215, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 07:42:43'),
(216, 'a393f297-d394-4520-af95-18083bf32a3d', 'UPDATE_PUBLIC_LANDING', 'landing_page_config', '11111111-1111-4111-8111-111111111111', 'Updated the public clinic landing page.', '::1', 'PATCH', '/api/public/landing/admin/config', 'aa8fe9e2-2c68-4278-ad5f-abc80ca8a8af', NULL, '2026-11-01 07:43:20'),
(217, 'a393f297-d394-4520-af95-18083bf32a3d', 'UPDATE_PUBLIC_LANDING', 'landing_page_config', '11111111-1111-4111-8111-111111111111', 'Updated the public clinic landing page.', '::1', 'PATCH', '/api/public/landing/admin/config', 'd58cf4ac-9485-4e9c-9279-68670b4f51b0', NULL, '2026-11-01 07:43:29'),
(218, 'a393f297-d394-4520-af95-18083bf32a3d', 'UPDATE_PUBLIC_LANDING', 'landing_page_config', '11111111-1111-4111-8111-111111111111', 'Updated the public clinic landing page.', '::1', 'PATCH', '/api/public/landing/admin/config', 'e9c873f5-943d-4f27-be63-68a073c8381b', NULL, '2026-11-01 07:51:52'),
(219, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 07:51:55'),
(220, 'a393f297-d394-4520-af95-18083bf32a3d', 'ACCEPT_PRIVACY_POLICY', 'policy_documents', '72000000-0000-4000-8000-000000000001', 'Super Admin accepted KLD School Clinic Privacy Policy version 1.0.', '::1', 'POST', '/api/auth/login', '3a5a0fca-91cf-425c-a500-8b4fa61d0d6e', '{\"documentType\":\"PRIVACY_POLICY\",\"version\":\"1.0\"}', '2026-11-01 12:53:46'),
(221, 'a393f297-d394-4520-af95-18083bf32a3d', 'ACCEPT_TERMS_AND_CONDITIONS', 'policy_documents', '72000000-0000-4000-8000-000000000002', 'Super Admin accepted KLD School Clinic System Terms and Conditions version 1.0.', '::1', 'POST', '/api/auth/login', '3a5a0fca-91cf-425c-a500-8b4fa61d0d6e', '{\"documentType\":\"TERMS_AND_CONDITIONS\",\"version\":\"1.0\"}', '2026-11-01 12:53:46'),
(222, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 12:53:46'),
(223, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 12:55:22'),
(224, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGIN', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'Super Admin signed in.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 12:56:33'),
(225, 'a393f297-d394-4520-af95-18083bf32a3d', 'ARCHIVE_PATIENT', 'patients', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Archived patient 2023-5-001659.', '::1', 'POST', '/api/archives/patients/9eb23708-59ef-4b37-a27f-0a3db5b91596/archive', '09b6f81e-d3b4-4f53-bd4a-ef17ddde486e', '{\"reason\":null}', '2026-11-01 12:57:13'),
(226, 'a393f297-d394-4520-af95-18083bf32a3d', 'UNARCHIVE_PATIENT', 'patients', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'Restored patient 2023-5-001659 to the active registry.', '::1', 'POST', '/api/archives/patients/9eb23708-59ef-4b37-a27f-0a3db5b91596/unarchive', 'c7aa6629-53a7-4e5a-9e07-e30f700d7fa6', NULL, '2026-11-01 12:57:23'),
(227, 'a393f297-d394-4520-af95-18083bf32a3d', 'EXPORT_REPORT', 'reports', NULL, 'Exported the clinic visit report as CSV.', '::1', 'GET', '/api/reports/visits.csv?dateFrom=2026-10-31&dateTo=2026-11-01&patientType=', '3bb4540c-95dc-43ed-8214-501c80129055', '{\"format\":\"CSV\",\"dateFrom\":\"2026-10-31\",\"dateTo\":\"2026-11-01\",\"patientType\":null,\"rowCount\":1}', '2026-11-01 12:57:50'),
(228, 'a393f297-d394-4520-af95-18083bf32a3d', 'EXPORT_REPORT', 'reports', NULL, 'Exported the clinic visit report as PDF.', '::1', 'GET', '/api/reports/visits.pdf?dateFrom=2026-10-31&dateTo=2026-11-01&patientType=', 'f30a469c-9ed3-4f2e-b627-d512f04f10f9', '{\"format\":\"PDF\",\"dateFrom\":\"2026-10-31\",\"dateTo\":\"2026-11-01\",\"patientType\":null,\"rowCount\":1}', '2026-11-01 12:58:07'),
(229, 'a393f297-d394-4520-af95-18083bf32a3d', 'LOGOUT', 'users', 'a393f297-d394-4520-af95-18083bf32a3d', 'admin signed out.', '::1', NULL, NULL, NULL, NULL, '2026-11-01 13:00:45');

-- --------------------------------------------------------

--
-- Table structure for table `api_idempotency_keys`
--

CREATE TABLE `api_idempotency_keys` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `scope` varchar(80) NOT NULL,
  `idempotency_key` varchar(120) NOT NULL,
  `resource_type` varchar(80) DEFAULT NULL,
  `resource_id` char(36) DEFAULT NULL,
  `response_json` longtext DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` char(36) NOT NULL,
  `appointment_number` varchar(40) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `service_id` char(36) NOT NULL,
  `requested_start` datetime NOT NULL,
  `requested_end` datetime NOT NULL,
  `proposed_start` datetime DEFAULT NULL,
  `proposed_end` datetime DEFAULT NULL,
  `confirmed_start` datetime DEFAULT NULL,
  `confirmed_end` datetime DEFAULT NULL,
  `reason` varchar(2000) NOT NULL,
  `status` enum('PENDING','CONFIRMED','PROPOSED','DECLINED','CANCELLED','CHECKED_IN','IN_QUEUE','IN_CONSULTATION','COMPLETED','NO_SHOW') NOT NULL DEFAULT 'PENDING',
  `student_response` enum('PENDING','ACCEPTED','DECLINED') DEFAULT NULL,
  `staff_notes` varchar(2000) DEFAULT NULL,
  `cancellation_reason` varchar(1000) DEFAULT NULL,
  `no_show_reason` varchar(1000) DEFAULT NULL,
  `requested_by_user_id` char(36) NOT NULL,
  `reviewed_by_user_id` char(36) DEFAULT NULL,
  `visit_id` char(36) DEFAULT NULL,
  `idempotency_key` varchar(100) DEFAULT NULL,
  `checked_in_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `no_show_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `appointment_number`, `patient_id`, `service_id`, `requested_start`, `requested_end`, `proposed_start`, `proposed_end`, `confirmed_start`, `confirmed_end`, `reason`, `status`, `student_response`, `staff_notes`, `cancellation_reason`, `no_show_reason`, `requested_by_user_id`, `reviewed_by_user_id`, `visit_id`, `idempotency_key`, `checked_in_at`, `completed_at`, `cancelled_at`, `no_show_at`, `created_at`, `updated_at`) VALUES
('e05f7941-ff24-4b0e-9edc-03ae74b01d07', 'APT-20261101-ND6OIJ', '9eb23708-59ef-4b37-a27f-0a3db5b91596', '31000000-0000-4000-8000-000000000002', '2026-11-02 09:00:00', '2026-11-02 09:30:00', NULL, NULL, '2026-11-02 09:00:00', '2026-11-02 09:30:00', 'clearance', 'COMPLETED', NULL, NULL, NULL, NULL, '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'a393f297-d394-4520-af95-18083bf32a3d', 'bf5e6164-c904-4820-b3ea-210bc3d72434', '1793507082536-55b26c65-7b9a-4f1a-ba6d-19d967582cc8', '2026-11-01 12:26:48', '2026-11-01 12:34:34', NULL, NULL, '2026-11-01 04:24:42', '2026-11-01 04:34:34');

-- --------------------------------------------------------

--
-- Table structure for table `appointment_reminders`
--

CREATE TABLE `appointment_reminders` (
  `id` char(36) NOT NULL,
  `appointment_id` char(36) NOT NULL,
  `reminder_type` enum('CONFIRMATION','CHANGE','ONE_DAY','TWO_HOUR','CANCELLATION') NOT NULL,
  `channel` enum('IN_APP','EMAIL') NOT NULL,
  `status` enum('PENDING','QUEUED','SENT','SKIPPED','FAILED') NOT NULL DEFAULT 'PENDING',
  `scheduled_for` datetime NOT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointment_reminders`
--

INSERT INTO `appointment_reminders` (`id`, `appointment_id`, `reminder_type`, `channel`, `status`, `scheduled_for`, `sent_at`, `created_at`) VALUES
('05fcea45-d476-4d35-b416-3b6d11bc7f44', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', 'TWO_HOUR', 'EMAIL', 'PENDING', '2026-11-02 07:00:00', NULL, '2026-11-01 04:25:37'),
('09c7959a-0c2a-4a11-afe2-a6ba2d3d9597', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', 'TWO_HOUR', 'IN_APP', 'PENDING', '2026-11-02 07:00:00', NULL, '2026-11-01 04:25:37'),
('4f25c760-ab68-4b73-a476-3155b18255b2', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', 'ONE_DAY', 'EMAIL', 'QUEUED', '2026-11-01 09:00:00', '2026-11-01 12:25:38', '2026-11-01 04:25:37'),
('9ef7b39a-0ca8-4c6a-9aa7-7214a60b5d2f', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', 'ONE_DAY', 'IN_APP', 'SENT', '2026-11-01 09:00:00', '2026-11-01 12:25:38', '2026-11-01 04:25:37');

-- --------------------------------------------------------

--
-- Table structure for table `appointment_services`
--

CREATE TABLE `appointment_services` (
  `id` char(36) NOT NULL,
  `name` varchar(180) NOT NULL,
  `description` varchar(2000) DEFAULT NULL,
  `duration_minutes` smallint(5) UNSIGNED NOT NULL DEFAULT 30,
  `slot_capacity` smallint(5) UNSIGNED NOT NULL DEFAULT 1,
  `daily_booking_limit` smallint(5) UNSIGNED DEFAULT NULL,
  `advance_booking_days` smallint(5) UNSIGNED NOT NULL DEFAULT 30,
  `minimum_notice_hours` smallint(5) UNSIGNED NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointment_services`
--

INSERT INTO `appointment_services` (`id`, `name`, `description`, `duration_minutes`, `slot_capacity`, `daily_booking_limit`, `advance_booking_days`, `minimum_notice_hours`, `is_active`, `is_public`, `sort_order`, `created_at`, `updated_at`) VALUES
('31000000-0000-4000-8000-000000000001', 'General Clinic Consultation', 'General school clinic consultation and health assessment.', 30, 2, 30, 30, 1, 1, 1, 10, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('31000000-0000-4000-8000-000000000002', 'Medical Clearance', 'Medical clearance review and documentation.', 30, 1, 15, 30, 4, 1, 1, 20, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('31000000-0000-4000-8000-000000000003', 'Follow-up Consultation', 'Scheduled return consultation after an earlier clinic encounter.', 20, 2, 30, 60, 1, 1, 1, 30, '2026-11-01 03:48:34', '2026-11-01 03:48:34');

-- --------------------------------------------------------

--
-- Table structure for table `appointment_status_history`
--

CREATE TABLE `appointment_status_history` (
  `id` char(36) NOT NULL,
  `appointment_id` char(36) NOT NULL,
  `from_status` varchar(40) DEFAULT NULL,
  `to_status` varchar(40) NOT NULL,
  `changed_by_user_id` char(36) NOT NULL,
  `reason` varchar(1000) DEFAULT NULL,
  `metadata_json` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointment_status_history`
--

INSERT INTO `appointment_status_history` (`id`, `appointment_id`, `from_status`, `to_status`, `changed_by_user_id`, `reason`, `metadata_json`, `created_at`) VALUES
('6b85a46b-7a49-44c1-9ea7-34409f886e56', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', NULL, 'PENDING', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'Appointment requested', NULL, '2026-11-01 04:24:42'),
('80b9b2f7-648c-41f5-a691-5955348af197', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', 'CONFIRMED', 'IN_QUEUE', 'a393f297-d394-4520-af95-18083bf32a3d', 'Patient checked in', NULL, '2026-11-01 04:26:48'),
('b4d61c3f-f1d8-47e7-9b6b-c2c0f278f9d6', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', 'PENDING', 'CONFIRMED', 'a393f297-d394-4520-af95-18083bf32a3d', NULL, '{\"notes\":null}', '2026-11-01 04:25:37');

-- --------------------------------------------------------

--
-- Table structure for table `archive_events`
--

CREATE TABLE `archive_events` (
  `id` char(36) NOT NULL,
  `entity_type` enum('PATIENT','MEDICINE') NOT NULL,
  `entity_id` char(36) NOT NULL,
  `action` enum('ARCHIVE','UNARCHIVE') NOT NULL,
  `reason` varchar(1000) DEFAULT NULL,
  `actor_user_id` char(36) NOT NULL,
  `metadata_json` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `archive_events`
--

INSERT INTO `archive_events` (`id`, `entity_type`, `entity_id`, `action`, `reason`, `actor_user_id`, `metadata_json`, `created_at`) VALUES
('0312e225-2289-4381-89f5-ba60b17bda58', 'PATIENT', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'UNARCHIVE', NULL, 'a393f297-d394-4520-af95-18083bf32a3d', NULL, '2026-11-01 12:57:23'),
('35dbe4ba-259f-442a-9ce3-9381c4abc31f', 'PATIENT', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'ARCHIVE', NULL, 'a393f297-d394-4520-af95-18083bf32a3d', '{\"blockers\":{\"activeAppointments\":0,\"openVisits\":0,\"activeFollowUps\":0}}', '2026-11-01 12:57:13');

-- --------------------------------------------------------

--
-- Table structure for table `clinic_forms`
--

CREATE TABLE `clinic_forms` (
  `id` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `audience` enum('ALL_STUDENTS','ASSIGNED_STUDENTS') NOT NULL DEFAULT 'ASSIGNED_STUDENTS',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clinic_form_versions`
--

CREATE TABLE `clinic_form_versions` (
  `id` char(36) NOT NULL,
  `form_id` char(36) NOT NULL,
  `version` int(10) UNSIGNED NOT NULL,
  `schema_json` longtext NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `published_at` datetime DEFAULT NULL,
  `created_by` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clinic_queue_entries`
--

CREATE TABLE `clinic_queue_entries` (
  `id` char(36) NOT NULL,
  `queue_date` date NOT NULL,
  `queue_number` int(10) UNSIGNED NOT NULL,
  `patient_id` char(36) NOT NULL,
  `appointment_id` char(36) DEFAULT NULL,
  `visit_id` char(36) NOT NULL,
  `priority` enum('NORMAL','MODERATE','URGENT','EMERGENCY') NOT NULL DEFAULT 'NORMAL',
  `status` enum('WAITING','CALLED','IN_CONSULTATION','COMPLETED','CANCELLED') NOT NULL DEFAULT 'WAITING',
  `checked_in_by` char(36) NOT NULL,
  `called_by` char(36) DEFAULT NULL,
  `checked_in_at` datetime NOT NULL,
  `called_at` datetime DEFAULT NULL,
  `consultation_started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `idempotency_key` varchar(100) DEFAULT NULL,
  `notes` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clinic_queue_entries`
--

INSERT INTO `clinic_queue_entries` (`id`, `queue_date`, `queue_number`, `patient_id`, `appointment_id`, `visit_id`, `priority`, `status`, `checked_in_by`, `called_by`, `checked_in_at`, `called_at`, `consultation_started_at`, `completed_at`, `cancelled_at`, `idempotency_key`, `notes`, `created_at`, `updated_at`) VALUES
('5d00a9e7-ed7c-455c-a7ad-d0fdae2acc11', '2026-11-01', 1, '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', 'bf5e6164-c904-4820-b3ea-210bc3d72434', 'NORMAL', 'COMPLETED', 'a393f297-d394-4520-af95-18083bf32a3d', 'a393f297-d394-4520-af95-18083bf32a3d', '2026-11-01 12:26:48', '2026-11-01 12:27:00', '2026-11-01 12:31:09', '2026-11-01 12:34:34', NULL, NULL, NULL, '2026-11-01 04:26:48', '2026-11-01 04:34:34');

-- --------------------------------------------------------

--
-- Table structure for table `clinic_schedules`
--

CREATE TABLE `clinic_schedules` (
  `id` char(36) NOT NULL,
  `service_id` char(36) NOT NULL,
  `day_of_week` tinyint(3) UNSIGNED NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `slot_capacity` smallint(5) UNSIGNED DEFAULT NULL,
  `booking_limit` smallint(5) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clinic_schedules`
--

INSERT INTO `clinic_schedules` (`id`, `service_id`, `day_of_week`, `start_time`, `end_time`, `slot_capacity`, `booking_limit`, `is_active`, `created_at`, `updated_at`) VALUES
('32000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', 1, '08:00:00', '17:00:00', 2, 30, 1, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('32000000-0000-4000-8000-000000000002', '31000000-0000-4000-8000-000000000001', 2, '08:00:00', '17:00:00', 2, 30, 1, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('32000000-0000-4000-8000-000000000003', '31000000-0000-4000-8000-000000000001', 3, '08:00:00', '17:00:00', 2, 30, 1, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('32000000-0000-4000-8000-000000000004', '31000000-0000-4000-8000-000000000001', 4, '08:00:00', '17:00:00', 2, 30, 1, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('32000000-0000-4000-8000-000000000005', '31000000-0000-4000-8000-000000000001', 5, '08:00:00', '17:00:00', 2, 30, 1, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('32000000-0000-4000-8000-000000000006', '31000000-0000-4000-8000-000000000002', 1, '09:00:00', '16:00:00', 1, 15, 1, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('32000000-0000-4000-8000-000000000007', '31000000-0000-4000-8000-000000000002', 3, '09:00:00', '16:00:00', 1, 15, 1, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('32000000-0000-4000-8000-000000000008', '31000000-0000-4000-8000-000000000002', 5, '09:00:00', '16:00:00', 1, 15, 1, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('32000000-0000-4000-8000-000000000009', '31000000-0000-4000-8000-000000000003', 1, '08:00:00', '17:00:00', 2, 30, 1, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('32000000-0000-4000-8000-000000000010', '31000000-0000-4000-8000-000000000003', 2, '08:00:00', '17:00:00', 2, 30, 1, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('32000000-0000-4000-8000-000000000011', '31000000-0000-4000-8000-000000000003', 3, '08:00:00', '17:00:00', 2, 30, 1, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('32000000-0000-4000-8000-000000000012', '31000000-0000-4000-8000-000000000003', 4, '08:00:00', '17:00:00', 2, 30, 1, '2026-11-01 03:48:34', '2026-11-01 03:48:34'),
('32000000-0000-4000-8000-000000000013', '31000000-0000-4000-8000-000000000003', 5, '08:00:00', '17:00:00', 2, 30, 1, '2026-11-01 03:48:34', '2026-11-01 03:48:34');

-- --------------------------------------------------------

--
-- Table structure for table `clinic_unavailable_dates`
--

CREATE TABLE `clinic_unavailable_dates` (
  `id` char(36) NOT NULL,
  `service_id` char(36) DEFAULT NULL,
  `unavailable_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `reason` varchar(500) NOT NULL,
  `created_by` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consultations`
--

CREATE TABLE `consultations` (
  `id` char(36) NOT NULL,
  `consultation_number` varchar(40) NOT NULL,
  `visit_id` char(36) NOT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `student_id` char(36) DEFAULT NULL,
  `staff_id` char(36) NOT NULL,
  `prepared_by_staff_id` char(36) DEFAULT NULL,
  `doctor_staff_id` char(36) DEFAULT NULL,
  `chief_complaint` text NOT NULL,
  `symptoms` mediumtext DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `findings` mediumtext DEFAULT NULL,
  `severity` enum('MILD','MODERATE','SEVERE','CRITICAL') NOT NULL DEFAULT 'MILD',
  `treatment_provided` mediumtext DEFAULT NULL,
  `dosage` varchar(500) DEFAULT NULL,
  `frequency` varchar(500) DEFAULT NULL,
  `duration` varchar(500) DEFAULT NULL,
  `recommendations` longtext DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `status` enum('DRAFT','IN_PROGRESS','COMPLETED','RELEASED') NOT NULL DEFAULT 'DRAFT',
  `completed_at` datetime DEFAULT NULL,
  `signed_off_at` datetime DEFAULT NULL,
  `signed_off_by_user_id` char(36) DEFAULT NULL,
  `legacy_completion` tinyint(1) NOT NULL DEFAULT 0,
  `released_at` datetime DEFAULT NULL,
  `released_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `consultations`
--

INSERT INTO `consultations` (`id`, `consultation_number`, `visit_id`, `patient_id`, `student_id`, `staff_id`, `prepared_by_staff_id`, `doctor_staff_id`, `chief_complaint`, `symptoms`, `diagnosis`, `findings`, `severity`, `treatment_provided`, `dosage`, `frequency`, `duration`, `recommendations`, `notes`, `status`, `completed_at`, `signed_off_at`, `signed_off_by_user_id`, `legacy_completion`, `released_at`, `released_by`, `created_at`, `updated_at`) VALUES
('63c25f32-8621-4af6-a23b-92e281b99a2b', 'CON-20261031-266CB5', '2fa537c4-520e-4a58-a2fa-ca257d9dd02d', '9eb23708-59ef-4b37-a27f-0a3db5b91596', '9eb23708-59ef-4b37-a27f-0a3db5b91596', '50910da7-8762-4747-b47a-b938fdf807d8', '50910da7-8762-4747-b47a-b938fdf807d8', NULL, 'Migraine', NULL, NULL, NULL, 'MILD', NULL, NULL, NULL, NULL, '[\"FOLLOW_UP\"]', NULL, 'COMPLETED', '2026-11-01 11:48:33', '2026-11-01 11:48:33', NULL, 1, NULL, NULL, '2026-10-31 09:21:50', '2026-11-01 03:48:34'),
('c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'CON-20261101-7UMPFJ', 'bf5e6164-c904-4820-b3ea-210bc3d72434', '9eb23708-59ef-4b37-a27f-0a3db5b91596', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'c37c2b24-5eb3-4438-a0f8-c48ebd12b88e', 'c37c2b24-5eb3-4438-a0f8-c48ebd12b88e', 'c37c2b24-5eb3-4438-a0f8-c48ebd12b88e', 'clearance', NULL, 'head ache', 'Cleared', 'MILD', NULL, NULL, NULL, NULL, '[\"RETURN_TO_CLASS\"]', 'Cleared\n\nCleared na pumasok\n', 'COMPLETED', '2026-11-01 12:34:34', '2026-11-01 12:34:34', '32be3719-9891-4392-b896-62a9e369c7be', 0, NULL, NULL, '2026-11-01 04:32:47', '2026-11-01 04:34:34');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_profiles`
--

CREATE TABLE `doctor_profiles` (
  `id` char(36) NOT NULL,
  `staff_id` char(36) NOT NULL,
  `specialization` varchar(180) DEFAULT NULL,
  `professional_license_number` varchar(100) NOT NULL,
  `license_expiration_date` date DEFAULT NULL,
  `signature_name` varchar(200) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `doctor_profiles`
--

INSERT INTO `doctor_profiles` (`id`, `staff_id`, `specialization`, `professional_license_number`, `license_expiration_date`, `signature_name`, `is_active`, `created_at`, `updated_at`) VALUES
('32fc9277-bf54-4f37-b8fa-e8e0f273e3ac', 'c37c2b24-5eb3-4438-a0f8-c48ebd12b88e', NULL, '77656', NULL, NULL, 1, '2026-11-01 04:30:00', '2026-11-01 04:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `email_delivery_logs`
--

CREATE TABLE `email_delivery_logs` (
  `id` char(36) NOT NULL,
  `queue_id` char(36) NOT NULL,
  `recipient` varchar(190) NOT NULL,
  `email_type` varchar(80) NOT NULL,
  `status` enum('SENT','FAILED') NOT NULL,
  `message_id` varchar(500) DEFAULT NULL,
  `error_message` varchar(1000) DEFAULT NULL,
  `attempted_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_delivery_logs`
--

INSERT INTO `email_delivery_logs` (`id`, `queue_id`, `recipient`, `email_type`, `status`, `message_id`, `error_message`, `attempted_at`) VALUES
('2ce1f785-0b8f-4fc7-84d2-5a314fbdc4e4', 'f0529da6-778d-4f0d-b287-a024de1e9b4a', 'dacpalustre@kld.edu.ph', 'ACCOUNT_CREATED', 'SENT', '<5ceaea87-112f-caab-ff48-7fd529062f5d@gmail.com>', NULL, '2026-10-31 16:18:39'),
('3f483945-28ff-43a6-8127-ef822db1a742', 'd944559c-8dc1-4556-a7c9-60cde81351bd', 'dacpalustre@kld.edu.ph', 'STUDENT_ACTIVATION', 'SENT', '<48e91ddd-a283-ab6c-03f6-43e21e982924@gmail.com>', NULL, '2026-10-31 15:47:57'),
('421c06d1-651b-4ac9-967b-444e87f7d59c', '7864d1c4-7550-4512-84f3-0d239dea21d0', 'dacpalustre@kld.edu.ph', 'APPOINTMENT_UPDATE', 'SENT', '<6f21ff4a-2034-85e9-476a-44fde8d02905@gmail.com>', NULL, '2026-11-01 12:24:58'),
('6ff2ba83-b1f3-4903-b8c1-791fae5c3aba', '69f0cb95-9a68-419d-b0eb-6f2515ff7553', 'dacpalustre@kld.edu.ph', 'APPOINTMENT_UPDATE', 'SENT', '<9508f7e1-1056-497f-d6a7-55f6879b9522@gmail.com>', NULL, '2026-11-01 12:25:41'),
('7ace6fce-9231-493a-b8ce-28a5e03d99b1', '4d5df948-76f6-4626-8e17-8fd5e2e125ae', 'dacpalustre@kld.edu.ph', 'STUDENT_ACTIVATION', 'SENT', '<84b392e2-3e8c-8658-4697-bcbd887b99ce@gmail.com>', NULL, '2026-10-31 16:18:06'),
('8e8e80fb-8469-4035-a5be-c205e7bcd929', '50f83d5b-096a-4faa-91f4-554644bbb4fb', 'dacpalustre@kld.edu.ph', 'PASSWORD_RESET', 'SENT', '<166fddb7-64d4-a271-f932-917d717bb1ed@gmail.com>', NULL, '2026-10-31 16:20:37'),
('c60fa384-c799-4817-81f1-89569fe72b4f', '71f7c5fa-40bd-46dc-a60c-18b3d60a4251', 'dacpalustre@kld.edu.ph', 'PASSWORD_RESET', 'SENT', '<888d57b2-2e57-8855-62bc-d793d30f62d8@gmail.com>', NULL, '2026-10-31 16:19:07'),
('d61a27d9-51f6-417e-afc5-c018f419adcc', '48edae73-2770-4af5-b57e-80685764f083', 'dacpalustre@kld.edu.ph', 'APPOINTMENT_REMINDER', 'SENT', '<6d05ba41-0b6b-3ce7-ceba-c9215bb4bf7e@gmail.com>', NULL, '2026-11-01 12:25:45');

-- --------------------------------------------------------

--
-- Table structure for table `email_queue`
--

CREATE TABLE `email_queue` (
  `id` char(36) NOT NULL,
  `recipient` varchar(190) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `template` varchar(80) NOT NULL,
  `payload_json` longtext DEFAULT NULL,
  `status` enum('PENDING','PROCESSING','RETRY','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  `attempts` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `next_attempt_at` datetime NOT NULL,
  `last_error` varchar(1000) DEFAULT NULL,
  `related_type` varchar(80) DEFAULT NULL,
  `related_id` char(36) DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_queue`
--

INSERT INTO `email_queue` (`id`, `recipient`, `subject`, `template`, `payload_json`, `status`, `attempts`, `next_attempt_at`, `last_error`, `related_type`, `related_id`, `sent_at`, `created_at`, `updated_at`) VALUES
('48edae73-2770-4af5-b57e-80685764f083', 'dacpalustre@kld.edu.ph', 'KLD Clinic appointment reminder', 'APPOINTMENT_REMINDER', '{\"title\":\"Clinic appointment reminder\",\"message\":\"<p>Reminder: your Medical Clearance appointment is scheduled for Nov 2, 2026, 9:00 AM.</p>\",\"actionUrl\":\"http://localhost:5173/student/appointments\",\"actionLabel\":\"Review appointment\"}', 'SENT', 1, '2026-11-01 12:25:38', NULL, 'appointments', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', '2026-11-01 12:25:45', '2026-11-01 04:25:38', '2026-11-01 04:25:45'),
('4d5df948-76f6-4626-8e17-8fd5e2e125ae', 'dacpalustre@kld.edu.ph', 'Activate your KLD Student Clinic Portal', 'STUDENT_ACTIVATION', '{\"title\":\"Verify your student clinic account\",\"message\":\"<p>Your information matched an eligible KLD student record. Continue through the secure link to create your clinic portal account.</p>\",\"actionUrl\":\"http://localhost:5173/activate-student?token=5c9ee3617571c16fd381bc6a11224887f9a848e3347aa877a67eccea09370054\",\"actionLabel\":\"Continue account activation\"}', 'SENT', 1, '2026-10-31 16:17:49', NULL, 'students', '9eb23708-59ef-4b37-a27f-0a3db5b91596', '2026-10-31 16:18:06', '2026-10-31 08:17:49', '2026-10-31 08:18:06'),
('50f83d5b-096a-4faa-91f4-554644bbb4fb', 'dacpalustre@kld.edu.ph', 'Reset your KLD Clinic password', 'PASSWORD_RESET', '{\"title\":\"Password reset requested\",\"message\":\"<p>Use the secure link below within 30 minutes to create a new password.</p>\",\"actionUrl\":\"http://localhost:5173/reset-password?token=5dd46f5512266aa3fea3584c7b0327d9d486d5ba282bdb1be13b16a5751853d0\",\"actionLabel\":\"Reset password\"}', 'SENT', 1, '2026-10-31 16:20:21', NULL, 'users', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', '2026-10-31 16:20:37', '2026-10-31 08:20:21', '2026-10-31 08:20:37'),
('69f0cb95-9a68-419d-b0eb-6f2515ff7553', 'dacpalustre@kld.edu.ph', 'KLD Clinic appointment confirmed', 'APPOINTMENT_UPDATE', '{\"title\":\"Appointment confirmed\",\"message\":\"<p>Appointment confirmed. Open the portal to review the schedule.</p>\",\"actionUrl\":\"http://localhost:5173/student/appointments\",\"actionLabel\":\"View appointment\"}', 'SENT', 1, '2026-11-01 12:25:37', NULL, 'appointments', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', '2026-11-01 12:25:41', '2026-11-01 04:25:37', '2026-11-01 04:25:41'),
('71f7c5fa-40bd-46dc-a60c-18b3d60a4251', 'dacpalustre@kld.edu.ph', 'Reset your KLD Clinic password', 'PASSWORD_RESET', '{\"title\":\"Password reset requested\",\"message\":\"<p>Use the secure link below within 30 minutes to create a new password.</p>\",\"actionUrl\":\"http://localhost:5173/reset-password?token=b3b58992d1a97d101e77ed057d06982e80a86c9d64a4a973b50394fea502e5cd\",\"actionLabel\":\"Reset password\"}', 'SENT', 1, '2026-10-31 16:19:03', NULL, 'users', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', '2026-10-31 16:19:07', '2026-10-31 08:19:03', '2026-10-31 08:19:07'),
('7864d1c4-7550-4512-84f3-0d239dea21d0', 'dacpalustre@kld.edu.ph', 'KLD Clinic appointment requested', 'APPOINTMENT_UPDATE', '{\"title\":\"Appointment requested\",\"message\":\"<p>Your appointment request APT-20261101-ND6OIJ was submitted and is awaiting clinic confirmation.</p>\",\"actionUrl\":\"http://localhost:5173/student/appointments\",\"actionLabel\":\"View appointment\"}', 'SENT', 1, '2026-11-01 12:24:42', NULL, 'appointments', 'e05f7941-ff24-4b0e-9edc-03ae74b01d07', '2026-11-01 12:24:58', '2026-11-01 04:24:42', '2026-11-01 04:24:58'),
('d944559c-8dc1-4556-a7c9-60cde81351bd', 'dacpalustre@kld.edu.ph', 'Activate your KLD Student Clinic Portal', 'STUDENT_ACTIVATION', '{\"title\":\"Verify your student clinic account\",\"message\":\"<p>Your information matched an eligible KLD student record. Continue through the secure link to create your clinic portal account.</p>\",\"actionUrl\":\"http://localhost:5173/activate-student?token=d1240f5fbe36786b3c50d4f2766b21f0751fe5065f3099e863a4aa64e6e33669\",\"actionLabel\":\"Continue account activation\"}', 'SENT', 1, '2026-10-31 15:47:45', NULL, 'students', '9eb23708-59ef-4b37-a27f-0a3db5b91596', '2026-10-31 15:47:57', '2026-10-31 07:47:45', '2026-10-31 07:47:57'),
('f0529da6-778d-4f0d-b287-a024de1e9b4a', 'dacpalustre@kld.edu.ph', 'Your KLD Student Clinic Portal is active', 'ACCOUNT_CREATED', '{\"title\":\"Account activated\",\"message\":\"<p>Hello DANIELA PALUSTRE, your KLD Student Clinic Portal account is ready.</p>\",\"actionUrl\":\"http://localhost:5173/login\",\"actionLabel\":\"Sign in\"}', 'SENT', 1, '2026-10-31 16:18:30', NULL, 'users', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', '2026-10-31 16:18:39', '2026-10-31 08:18:30', '2026-10-31 08:18:39');

-- --------------------------------------------------------

--
-- Table structure for table `email_verification_tokens`
--

CREATE TABLE `email_verification_tokens` (
  `id` char(36) NOT NULL,
  `student_id` char(36) NOT NULL,
  `email` varchar(190) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `purpose` enum('STUDENT_ACTIVATION','EMAIL_CHANGE') NOT NULL,
  `attempts` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_verification_tokens`
--

INSERT INTO `email_verification_tokens` (`id`, `student_id`, `email`, `token_hash`, `purpose`, `attempts`, `expires_at`, `used_at`, `created_at`) VALUES
('03e506fe-057a-49d6-8e71-89fdf5b509e1', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'dacpalustre@kld.edu.ph', 'f6c9dd142760176b26214eada95a27b0efecc5572cf97f1abf54bb15ece67b0e', 'STUDENT_ACTIVATION', 0, '2026-10-31 16:47:49', '2026-10-31 16:18:29', '2026-10-31 08:17:49'),
('962f736b-efda-4b9b-aefa-24aa6383382d', '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'dacpalustre@kld.edu.ph', 'e1cdb306c315b5fe4dfd535251068e9157ddf3534b814de8d46bd85c7ece4d93', 'STUDENT_ACTIVATION', 0, '2026-10-31 16:17:45', '2026-10-31 16:17:49', '2026-10-31 07:47:45');

-- --------------------------------------------------------

--
-- Table structure for table `emergency_contacts`
--

CREATE TABLE `emergency_contacts` (
  `id` char(36) NOT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `student_id` char(36) DEFAULT NULL,
  `full_name` varchar(200) NOT NULL,
  `relationship` varchar(80) DEFAULT NULL,
  `contact_number` varchar(40) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` char(36) NOT NULL,
  `employee_number` varchar(40) NOT NULL,
  `category_id` char(36) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `birth_date` date NOT NULL,
  `sex` enum('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY') NOT NULL,
  `department` varchar(180) NOT NULL,
  `position_title` varchar(180) DEFAULT NULL,
  `employment_status` enum('ACTIVE','INACTIVE','ON_LEAVE','SEPARATED') NOT NULL DEFAULT 'ACTIVE',
  `email` varchar(190) DEFAULT NULL,
  `contact_number` varchar(40) DEFAULT NULL,
  `address` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_categories`
--

CREATE TABLE `employee_categories` (
  `id` char(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employee_categories`
--

INSERT INTO `employee_categories` (`id`, `name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
('21000000-0000-4000-8000-000000000001', 'Faculty / Professor', 'Teaching personnel', 1, '2026-11-01 03:48:28', '2026-11-01 03:48:28'),
('21000000-0000-4000-8000-000000000002', 'Maintenance', 'Facilities and maintenance personnel', 1, '2026-11-01 03:48:28', '2026-11-01 03:48:28'),
('21000000-0000-4000-8000-000000000003', 'Security', 'Campus security personnel', 1, '2026-11-01 03:48:28', '2026-11-01 03:48:28'),
('21000000-0000-4000-8000-000000000004', 'University Administrator', 'Administrative leadership and office personnel', 1, '2026-11-01 03:48:28', '2026-11-01 03:48:28'),
('21000000-0000-4000-8000-000000000005', 'Other Personnel', 'Other school employees', 1, '2026-11-01 03:48:28', '2026-11-01 03:48:28');

-- --------------------------------------------------------

--
-- Table structure for table `follow_ups`
--

CREATE TABLE `follow_ups` (
  `id` char(36) NOT NULL,
  `follow_up_number` varchar(40) NOT NULL,
  `consultation_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `reason` varchar(2000) NOT NULL,
  `target_date` date NOT NULL,
  `assigned_staff_id` char(36) DEFAULT NULL,
  `assigned_doctor_staff_id` char(36) DEFAULT NULL,
  `notes` varchar(3000) DEFAULT NULL,
  `status` enum('PENDING','SCHEDULED','COMPLETED','MISSED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `appointment_id` char(36) DEFAULT NULL,
  `created_by_user_id` char(36) NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `follow_up_reminders`
--

CREATE TABLE `follow_up_reminders` (
  `id` char(36) NOT NULL,
  `follow_up_id` char(36) NOT NULL,
  `reminder_type` enum('CREATED','ONE_DAY','MISSED') NOT NULL,
  `channel` enum('IN_APP','EMAIL') NOT NULL,
  `status` enum('PENDING','QUEUED','SENT','SKIPPED','FAILED') NOT NULL DEFAULT 'PENDING',
  `scheduled_for` datetime NOT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `form_assignments`
--

CREATE TABLE `form_assignments` (
  `id` char(36) NOT NULL,
  `form_version_id` char(36) NOT NULL,
  `student_id` char(36) NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('ASSIGNED','DRAFT','SUBMITTED','CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
  `assigned_by` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `form_submissions`
--

CREATE TABLE `form_submissions` (
  `id` char(36) NOT NULL,
  `assignment_id` char(36) NOT NULL,
  `form_version_id` char(36) NOT NULL,
  `student_id` char(36) NOT NULL,
  `reference_number` varchar(40) NOT NULL,
  `status` enum('SUBMITTED','CORRECTED') NOT NULL DEFAULT 'SUBMITTED',
  `submitted_at` datetime NOT NULL,
  `receipt_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `form_submission_answers`
--

CREATE TABLE `form_submission_answers` (
  `id` char(36) NOT NULL,
  `submission_id` char(36) NOT NULL,
  `field_key` varchar(100) NOT NULL,
  `question_snapshot` varchar(500) NOT NULL,
  `answer_json` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guardians`
--

CREATE TABLE `guardians` (
  `id` char(36) NOT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `student_id` char(36) DEFAULT NULL,
  `full_name` varchar(200) NOT NULL,
  `relationship` varchar(80) DEFAULT NULL,
  `contact_number` varchar(40) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `address` varchar(1000) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_adjustment_requests`
--

CREATE TABLE `inventory_adjustment_requests` (
  `id` char(36) NOT NULL,
  `adjustment_number` varchar(40) NOT NULL,
  `medicine_id` char(36) NOT NULL,
  `batch_id` char(36) NOT NULL,
  `adjustment_type` enum('DAMAGED','LOST','EXPIRED','CORRECTION','RECONCILIATION') NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `reason` varchar(1000) NOT NULL,
  `supporting_notes` varchar(3000) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','APPLIED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `before_quantity` int(10) UNSIGNED NOT NULL,
  `after_quantity` int(10) UNSIGNED DEFAULT NULL,
  `requested_by` char(36) NOT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `requested_at` datetime NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` datetime DEFAULT NULL,
  `applied_at` datetime DEFAULT NULL,
  `review_notes` varchar(2000) DEFAULT NULL,
  `stock_count_item_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_transactions`
--

CREATE TABLE `inventory_transactions` (
  `id` char(36) NOT NULL,
  `medicine_id` char(36) NOT NULL,
  `batch_id` char(36) NOT NULL,
  `transaction_type` enum('RECEIPT','ISSUANCE','RETURN','ADJUSTMENT','EXPIRY_WRITE_OFF','DAMAGE','LOSS','CORRECTION','RECONCILIATION') NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `balance_after` int(10) UNSIGNED NOT NULL,
  `reference_type` varchar(60) DEFAULT NULL,
  `reference_id` char(36) DEFAULT NULL,
  `created_by` char(36) NOT NULL,
  `notes` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_transactions`
--

INSERT INTO `inventory_transactions` (`id`, `medicine_id`, `batch_id`, `transaction_type`, `quantity_change`, `balance_after`, `reference_type`, `reference_id`, `created_by`, `notes`, `created_at`) VALUES
('62ee329e-36b4-4db8-a734-061b5e2922ff', 'a39e7f22-a825-497d-afee-23adae4be1bf', '0fad9a47-276b-414e-997e-3f414bee82d6', 'RECEIPT', 100, 100, 'STOCK_RECEIPT', NULL, 'a393f297-d394-4520-af95-18083bf32a3d', NULL, '2026-11-01 04:21:17'),
('7df0d8ef-6726-4767-b98c-d9a15b828b47', '77a44cda-b4b4-420c-92c4-89e0bfe7c44a', 'c1061dd2-5b86-4d74-844c-e577fa91caf2', 'RECEIPT', 9, 9, 'STOCK_RECEIPT', NULL, 'a393f297-d394-4520-af95-18083bf32a3d', NULL, '2026-11-01 04:18:43');

-- --------------------------------------------------------

--
-- Table structure for table `landing_content_items`
--

CREATE TABLE `landing_content_items` (
  `id` char(36) NOT NULL,
  `section_type` enum('ANNOUNCEMENT','PROMOTION','SERVICE','TEAM') NOT NULL,
  `title` varchar(220) NOT NULL,
  `summary` varchar(2000) DEFAULT NULL,
  `body` mediumtext DEFAULT NULL,
  `publication_date` date DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `link_label` varchar(100) DEFAULT NULL,
  `link_url` varchar(500) DEFAULT NULL,
  `metadata_json` longtext DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `publish_from` datetime DEFAULT NULL,
  `publish_until` datetime DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `landing_content_media`
--

CREATE TABLE `landing_content_media` (
  `id` char(36) NOT NULL,
  `content_item_id` char(36) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `alt_text` varchar(300) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_cover` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `landing_page_config`
--

CREATE TABLE `landing_page_config` (
  `id` char(36) NOT NULL,
  `hero_heading` varchar(220) NOT NULL,
  `hero_description` varchar(2000) DEFAULT NULL,
  `hero_media_type` enum('IMAGE','VIDEO','NONE') NOT NULL DEFAULT 'NONE',
  `hero_media_path` varchar(500) DEFAULT NULL,
  `hero_fallback_path` varchar(500) DEFAULT NULL,
  `primary_cta_label` varchar(100) DEFAULT NULL,
  `primary_cta_url` varchar(500) DEFAULT NULL,
  `secondary_cta_label` varchar(100) DEFAULT NULL,
  `secondary_cta_url` varchar(500) DEFAULT NULL,
  `about_heading` varchar(180) DEFAULT NULL,
  `about_content` mediumtext DEFAULT NULL,
  `contact_heading` varchar(180) DEFAULT NULL,
  `contact_content` mediumtext DEFAULT NULL,
  `operating_hours` mediumtext DEFAULT NULL,
  `location_text` varchar(1000) DEFAULT NULL,
  `location_url` varchar(500) DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `landing_page_config`
--

INSERT INTO `landing_page_config` (`id`, `hero_heading`, `hero_description`, `hero_media_type`, `hero_media_path`, `hero_fallback_path`, `primary_cta_label`, `primary_cta_url`, `secondary_cta_label`, `secondary_cta_url`, `about_heading`, `about_content`, `contact_heading`, `contact_content`, `operating_hours`, `location_text`, `location_url`, `is_published`, `updated_by`, `created_at`, `updated_at`) VALUES
('11111111-1111-4111-8111-111111111111', 'KLD School Clinic', 'Accessible, confidential, and coordinated healthcare support for the KLD community.', 'IMAGE', '/uploads/landing/1793519512401-5x6tm03g.png', NULL, 'Sign In', '/login', 'Request an Appointment', '/student/appointments', 'About the Clinic', 'The KLD School Clinic supports student and employee wellness through first aid, consultations, health education, medicine management, and coordinated referrals.', 'Contact the Clinic', 'For urgent concerns during school hours, contact the clinic or proceed directly to the clinic reception area.', 'Monday to Friday, 8:00 AM to 5:00 PM', 'Kolehiyo ng Lungsod ng Dasmariñas', NULL, 1, 'a393f297-d394-4520-af95-18083bf32a3d', '2026-11-01 03:48:27', '2026-11-01 07:51:52');

-- --------------------------------------------------------

--
-- Table structure for table `medical_attachments`
--

CREATE TABLE `medical_attachments` (
  `id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `visit_id` char(36) DEFAULT NULL,
  `consultation_id` char(36) DEFAULT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `relative_path` varchar(500) NOT NULL,
  `mime_type` varchar(120) NOT NULL,
  `file_size` int(10) UNSIGNED NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `uploaded_by` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `medical_attachments`
--

INSERT INTO `medical_attachments` (`id`, `patient_id`, `visit_id`, `consultation_id`, `original_name`, `stored_name`, `relative_path`, `mime_type`, `file_size`, `description`, `uploaded_by`, `created_at`) VALUES
('c52de0e2-3a24-4ea2-8a3d-1d43a07a7f0a', '9eb23708-59ef-4b37-a27f-0a3db5b91596', NULL, 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', 'Navy and white Germiston Antlers logo.png', '1793507613197-md1xil9jtu.png', 'medical/1793507613197-md1xil9jtu.png', 'image/png', 1257977, 'Cleared', '32be3719-9891-4392-b896-62a9e369c7be', '2026-11-01 04:33:33');

-- --------------------------------------------------------

--
-- Table structure for table `medical_record_revisions`
--

CREATE TABLE `medical_record_revisions` (
  `id` char(36) NOT NULL,
  `consultation_id` char(36) NOT NULL,
  `revised_by` char(36) NOT NULL,
  `reason` varchar(1000) NOT NULL,
  `before_data` longtext NOT NULL,
  `after_data` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medicines`
--

CREATE TABLE `medicines` (
  `id` char(36) NOT NULL,
  `medicine_code` varchar(40) NOT NULL,
  `generic_name` varchar(180) NOT NULL,
  `brand_name` varchar(180) DEFAULT NULL,
  `category_id` char(36) DEFAULT NULL,
  `dosage_form` varchar(120) NOT NULL,
  `unit` varchar(40) NOT NULL,
  `minimum_stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `supplier` varchar(180) DEFAULT NULL,
  `storage_location` varchar(180) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `pre_archive_is_active` tinyint(1) DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `archived_by` char(36) DEFAULT NULL,
  `archive_reason` varchar(1000) DEFAULT NULL,
  `unarchived_at` datetime DEFAULT NULL,
  `unarchived_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `medicines`
--

INSERT INTO `medicines` (`id`, `medicine_code`, `generic_name`, `brand_name`, `category_id`, `dosage_form`, `unit`, `minimum_stock`, `supplier`, `storage_location`, `is_active`, `pre_archive_is_active`, `archived_at`, `archived_by`, `archive_reason`, `unarchived_at`, `unarchived_by`, `created_at`, `updated_at`) VALUES
('77a44cda-b4b4-420c-92c4-89e0bfe7c44a', 'MED-20261101-4Y4PKO', 'meow', 'meow', '31e6e139-3a0a-4b87-80fd-87226f64797e', '25 mg', 'tablet', 10, 'meow', 'mwoe', 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-11-01 04:16:31', '2026-11-01 04:16:56'),
('a39e7f22-a825-497d-afee-23adae4be1bf', 'MED-20261101-5SWNLD', 'Paracetamol', 'Biogesic', NULL, '500 mg', 'Tablet', 10, 'Unilab', 'Main Cabinet', 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-11-01 04:20:42', '2026-11-01 04:20:42');

-- --------------------------------------------------------

--
-- Table structure for table `medicine_batches`
--

CREATE TABLE `medicine_batches` (
  `id` char(36) NOT NULL,
  `medicine_id` char(36) NOT NULL,
  `batch_number` varchar(100) NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `expiration_date` date NOT NULL,
  `received_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `medicine_batches`
--

INSERT INTO `medicine_batches` (`id`, `medicine_id`, `batch_number`, `quantity`, `expiration_date`, `received_date`, `created_at`, `updated_at`) VALUES
('0fad9a47-276b-414e-997e-3f414bee82d6', 'a39e7f22-a825-497d-afee-23adae4be1bf', 'BTCH-00002', 100, '2026-12-01', '2026-11-01', '2026-11-01 04:21:17', '2026-11-01 04:21:17'),
('c1061dd2-5b86-4d74-844c-e577fa91caf2', '77a44cda-b4b4-420c-92c4-89e0bfe7c44a', 'BTCH-00001', 9, '2026-11-26', '2026-11-01', '2026-11-01 04:18:43', '2026-11-01 04:18:43');

-- --------------------------------------------------------

--
-- Table structure for table `medicine_categories`
--

CREATE TABLE `medicine_categories` (
  `id` char(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `medicine_categories`
--

INSERT INTO `medicine_categories` (`id`, `name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
('31e6e139-3a0a-4b87-80fd-87226f64797e', 'arf', NULL, 0, '2026-11-01 04:16:31', '2026-11-01 04:21:55');

-- --------------------------------------------------------

--
-- Table structure for table `medicine_issuances`
--

CREATE TABLE `medicine_issuances` (
  `id` char(36) NOT NULL,
  `issuance_number` varchar(40) NOT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `student_id` char(36) DEFAULT NULL,
  `visit_id` char(36) DEFAULT NULL,
  `consultation_id` char(36) DEFAULT NULL,
  `issued_by` char(36) NOT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('COMPLETED','VOIDED') NOT NULL DEFAULT 'COMPLETED',
  `issued_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `voided_at` datetime DEFAULT NULL,
  `voided_by` char(36) DEFAULT NULL,
  `void_reason` varchar(1000) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medicine_issuance_items`
--

CREATE TABLE `medicine_issuance_items` (
  `id` char(36) NOT NULL,
  `issuance_id` char(36) NOT NULL,
  `medicine_id` char(36) NOT NULL,
  `batch_id` char(36) NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `dosage` varchar(300) NOT NULL,
  `frequency` varchar(300) NOT NULL,
  `duration` varchar(300) NOT NULL,
  `instructions` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `role_id` int(10) UNSIGNED DEFAULT NULL,
  `student_id` char(36) DEFAULT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `notification_type` varchar(80) NOT NULL,
  `severity` enum('INFO','WARNING','CRITICAL') NOT NULL DEFAULT 'INFO',
  `title` varchar(200) NOT NULL,
  `message` varchar(2000) NOT NULL,
  `link` varchar(500) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `role_id`, `student_id`, `patient_id`, `notification_type`, `severity`, `title`, `message`, `link`, `is_read`, `read_at`, `created_at`) VALUES
('1ef9d924-2c0a-42c5-ac9d-156ff0759afa', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', NULL, NULL, '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'APPOINTMENT_CONFIRMED', 'INFO', 'Appointment confirmed', 'Appointment confirmed. Open the portal to review the schedule.', '/student/appointments', 0, NULL, '2026-11-01 04:25:37'),
('3da6e924-af95-47c4-9414-71303ed0a897', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', NULL, NULL, '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'APPOINTMENT_REMINDER', 'INFO', 'Clinic appointment reminder', 'Reminder: your Medical Clearance appointment is scheduled for Nov 2, 2026, 9:00 AM.', '/student/appointments', 0, NULL, '2026-11-01 04:25:38'),
('51a2a46c-bdfa-431d-ab09-69e72cc86733', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', NULL, NULL, '9eb23708-59ef-4b37-a27f-0a3db5b91596', 'APPOINTMENT_REQUESTED', 'INFO', 'Appointment requested', 'Your appointment request APT-20261101-ND6OIJ was submitted and is awaiting clinic confirmation.', '/student/appointments', 0, NULL, '2026-11-01 04:24:42');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `used_at`, `created_at`) VALUES
('046b5251-7b40-43f4-bb6c-c44d0474d572', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', '90df126dff8bfd47425eddd64182dd242c1cfde6565628ef3370d39445cae171', '2026-10-31 16:50:21', '2026-10-31 16:21:03', '2026-10-31 08:20:21'),
('d09ab09a-8866-4a7f-80bf-addf073f6f3a', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'c2055cbc0e295ad1feef82dd4c0a5bef4a8feb7f430be6da91db32e057c8dfaf', '2026-10-31 16:49:03', NULL, '2026-10-31 08:19:03');

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` char(36) NOT NULL,
  `patient_type` enum('STUDENT','EMPLOYEE') NOT NULL,
  `student_id` char(36) DEFAULT NULL,
  `employee_id` char(36) DEFAULT NULL,
  `record_number` varchar(40) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `pre_archive_status` varchar(20) DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `archived_by` char(36) DEFAULT NULL,
  `archive_reason` varchar(1000) DEFAULT NULL,
  `unarchived_at` datetime DEFAULT NULL,
  `unarchived_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `patient_type`, `student_id`, `employee_id`, `record_number`, `status`, `pre_archive_status`, `archived_at`, `archived_by`, `archive_reason`, `unarchived_at`, `unarchived_by`, `created_at`, `updated_at`) VALUES
('9eb23708-59ef-4b37-a27f-0a3db5b91596', 'STUDENT', '9eb23708-59ef-4b37-a27f-0a3db5b91596', NULL, '2023-5-001659', 'ACTIVE', NULL, NULL, NULL, NULL, '2026-11-01 20:57:23', 'a393f297-d394-4520-af95-18083bf32a3d', '2026-10-31 07:43:53', '2026-11-01 12:57:23');

-- --------------------------------------------------------

--
-- Table structure for table `patient_correction_requests`
--

CREATE TABLE `patient_correction_requests` (
  `id` char(36) NOT NULL,
  `request_number` varchar(40) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `requested_by_user_id` char(36) NOT NULL,
  `request_type` enum('CONTACT','GUARDIAN','EMERGENCY_CONTACT','HEALTH_INFORMATION') NOT NULL,
  `current_values_json` longtext NOT NULL,
  `proposed_values_json` longtext NOT NULL,
  `source_updated_at` datetime DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','CONFLICT','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `reviewer_comments` varchar(2000) DEFAULT NULL,
  `reviewed_by_user_id` char(36) DEFAULT NULL,
  `submitted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` datetime DEFAULT NULL,
  `applied_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient_measurements`
--

CREATE TABLE `patient_measurements` (
  `id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `height_cm` decimal(7,2) DEFAULT NULL,
  `weight_kg` decimal(7,2) DEFAULT NULL,
  `measured_on` date NOT NULL,
  `source` enum('PATIENT_SELF_REPORTED','CLINIC_STAFF','IMPORT') NOT NULL,
  `submitted_by_user_id` char(36) DEFAULT NULL,
  `recorded_by_staff_id` char(36) DEFAULT NULL,
  `notes` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient_medical_history`
--

CREATE TABLE `patient_medical_history` (
  `id` char(36) NOT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `student_id` char(36) DEFAULT NULL,
  `blood_type` varchar(10) DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `existing_conditions` text DEFAULT NULL,
  `current_medications` text DEFAULT NULL,
  `medical_history` mediumtext DEFAULT NULL,
  `immunizations` mediumtext DEFAULT NULL,
  `important_alerts` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `patient_medical_history`
--

INSERT INTO `patient_medical_history` (`id`, `patient_id`, `student_id`, `blood_type`, `allergies`, `existing_conditions`, `current_medications`, `medical_history`, `immunizations`, `important_alerts`, `created_at`, `updated_at`) VALUES
('9d988367-84e4-4374-aaf0-866a29365adf', '9eb23708-59ef-4b37-a27f-0a3db5b91596', '9eb23708-59ef-4b37-a27f-0a3db5b91596', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-31 07:43:53', '2026-11-01 03:48:30');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(80) NOT NULL,
  `description` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `code`, `description`) VALUES
(1, 'dashboard.read', 'View clinic dashboard'),
(2, 'patients.read', 'View student and patient records'),
(3, 'patients.write', 'Create and update student and patient records'),
(4, 'visits.read', 'View clinic visits'),
(5, 'visits.write', 'Register and update clinic visits'),
(6, 'consultations.read', 'View consultation records'),
(7, 'consultations.write', 'Create and update consultations'),
(8, 'consultations.release', 'Release completed consultation results'),
(9, 'medicines.read', 'View medicine inventory and issuance'),
(10, 'medicines.write', 'Manage medicines and batches'),
(11, 'medicines.issue', 'Issue and void medicines'),
(12, 'staff.read', 'View staff directory'),
(13, 'staff.manage', 'Manage staff and roles'),
(14, 'reports.read', 'View and export reports'),
(15, 'logs.read', 'View audit logs'),
(16, 'settings.read', 'View settings'),
(17, 'settings.manage', 'Change settings'),
(18, 'forms.manage', 'Manage clinic forms'),
(19, 'student_accounts.manage', 'Manage student portal accounts'),
(20, 'email_logs.read', 'View email delivery monitoring'),
(21, 'landing.manage', 'Manage the public clinic landing page'),
(22, 'appointments.read', 'View appointment schedules'),
(23, 'appointments.write', 'Request and update appointments'),
(24, 'appointments.manage', 'Approve, decline, reschedule, cancel, and check in appointments'),
(25, 'queue.manage', 'Manage the clinic queue'),
(26, 'followups.manage', 'Create and manage clinical follow-ups'),
(27, 'inventory.adjust.request', 'Request medicine stock adjustments'),
(28, 'inventory.adjust.approve', 'Approve medicine stock adjustments'),
(29, 'inventory.count', 'Perform physical medicine stock counts'),
(30, 'patient_corrections.review', 'Review patient information correction requests'),
(31, 'attachments.manage', 'Upload and manage authorized medical attachments'),
(32, 'consultations.signoff', 'Clinically complete and sign consultations'),
(33, 'employees.manage', 'Manage employee patient records'),
(34, 'policies.manage', 'Create and publish privacy and terms documents'),
(35, 'archives.read', 'View archived patient and medicine records'),
(36, 'patients.archive', 'Archive patient records after operational checks'),
(37, 'patients.unarchive', 'Restore archived patient records'),
(38, 'medicines.archive', 'Archive medicines after inventory checks'),
(39, 'medicines.unarchive', 'Restore archived medicines');

-- --------------------------------------------------------

--
-- Table structure for table `physical_assessments`
--

CREATE TABLE `physical_assessments` (
  `id` char(36) NOT NULL,
  `consultation_id` char(36) NOT NULL,
  `general_appearance` text DEFAULT NULL,
  `heent` text DEFAULT NULL,
  `respiratory` text DEFAULT NULL,
  `cardiovascular` text DEFAULT NULL,
  `abdomen` text DEFAULT NULL,
  `musculoskeletal` text DEFAULT NULL,
  `skin` text DEFAULT NULL,
  `neurological` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `physical_assessments`
--

INSERT INTO `physical_assessments` (`id`, `consultation_id`, `general_appearance`, `heent`, `respiratory`, `cardiovascular`, `abdomen`, `musculoskeletal`, `skin`, `neurological`, `created_at`, `updated_at`) VALUES
('2c2cf42f-204e-4766-9444-f4b550a22b9d', '63c25f32-8621-4af6-a23b-92e281b99a2b', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-31 09:21:50', '2026-10-31 09:22:15'),
('2e0538bb-aabc-4518-b498-0f6ddd3a0fb3', 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-11-01 04:32:47', '2026-11-01 04:34:26');

-- --------------------------------------------------------

--
-- Table structure for table `policy_acceptances`
--

CREATE TABLE `policy_acceptances` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `document_id` char(36) NOT NULL,
  `document_type` enum('PRIVACY_POLICY','TERMS_AND_CONDITIONS') NOT NULL,
  `document_version` varchar(40) NOT NULL,
  `accepted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `policy_acceptances`
--

INSERT INTO `policy_acceptances` (`id`, `user_id`, `document_id`, `document_type`, `document_version`, `accepted_at`, `ip_address`, `user_agent`, `created_at`) VALUES
('63d9865a-0596-4802-9df4-e0727dcaf8dc', 'a393f297-d394-4520-af95-18083bf32a3d', '72000000-0000-4000-8000-000000000001', 'PRIVACY_POLICY', '1.0', '2026-11-01 20:53:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-11-01 12:53:46'),
('dab3db75-bd77-4d19-941e-994264c0df06', 'a393f297-d394-4520-af95-18083bf32a3d', '72000000-0000-4000-8000-000000000002', 'TERMS_AND_CONDITIONS', '1.0', '2026-11-01 20:53:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-11-01 12:53:46');

-- --------------------------------------------------------

--
-- Table structure for table `policy_documents`
--

CREATE TABLE `policy_documents` (
  `id` char(36) NOT NULL,
  `document_type` enum('PRIVACY_POLICY','TERMS_AND_CONDITIONS') NOT NULL,
  `version` varchar(40) NOT NULL,
  `title` varchar(220) NOT NULL,
  `body` mediumtext NOT NULL,
  `status` enum('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `published_at` datetime DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `policy_documents`
--

INSERT INTO `policy_documents` (`id`, `document_type`, `version`, `title`, `body`, `status`, `published_at`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
('72000000-0000-4000-8000-000000000001', 'PRIVACY_POLICY', '1.0', 'KLD School Clinic Privacy Policy', 'The KLD School Clinic collects and processes identity, contact, enrollment or employment, appointment, visit, consultation, medicine, form, and related health information to provide clinic services, maintain accurate medical records, support referrals, communicate authorized results, protect campus health, and meet legitimate administrative and legal obligations.\n\nAccess is limited according to assigned roles and patient ownership. Sensitive medical information is not intended for public disclosure. Important access, changes, exports, and clinical actions are audited. Information is retained according to approved school and clinic policies, and reasonable safeguards are applied to accounts, sessions, uploads, database access, backups, and email delivery.\n\nQuestions, correction requests, or privacy concerns may be directed to the clinic or the authorized school privacy office using the contact information published in the system.', 'PUBLISHED', '2026-11-01 20:21:13', NULL, NULL, '2026-11-01 12:21:13', '2026-11-01 12:21:13'),
('72000000-0000-4000-8000-000000000002', 'TERMS_AND_CONDITIONS', '1.0', 'KLD School Clinic System Terms and Conditions', 'This system is provided for authorized school-clinic operations and permitted patient self-service. Users must provide accurate information, protect their credentials, use only the records and functions they are authorized to access, and immediately report suspected unauthorized access.\n\nThe portal does not replace emergency services. Urgent or life-threatening concerns must be brought directly to the clinic or appropriate emergency responders. Appointment requests remain subject to clinic confirmation, capacity, operating schedules, and professional assessment.\n\nUnauthorized access, disclosure, alteration, copying, or misuse of medical information is prohibited. System activity may be logged and reviewed for security, privacy, quality, and accountability. Continued access may be suspended when these terms or applicable policies are violated.', 'PUBLISHED', '2026-11-01 20:21:13', NULL, NULL, '2026-11-01 12:21:13', '2026-11-01 12:21:13');

-- --------------------------------------------------------

--
-- Table structure for table `queue_daily_counters`
--

CREATE TABLE `queue_daily_counters` (
  `queue_date` date NOT NULL,
  `last_number` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `queue_daily_counters`
--

INSERT INTO `queue_daily_counters` (`queue_date`, `last_number`, `updated_at`) VALUES
('2026-11-01', 1, '2026-11-01 04:26:48');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(40) NOT NULL,
  `name` varchar(100) NOT NULL,
  `rank` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `code`, `name`, `rank`, `created_at`) VALUES
(1, 'SUPER_ADMIN', 'Super Administrator', 100, '2026-10-26 03:21:44'),
(2, 'CLINIC_ADMIN', 'Clinic Administrator', 80, '2026-10-26 03:21:44'),
(3, 'CLINIC_STAFF', 'Clinic Staff / Nurse', 60, '2026-10-26 03:21:44'),
(4, 'VIEWER', 'Viewer / Authorized Staff', 40, '2026-10-26 03:21:44'),
(5, 'STUDENT', 'KLD Student', 20, '2026-10-26 03:21:44'),
(6, 'DOCTOR', 'Clinic Doctor', 70, '2026-11-01 03:48:27');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int(10) UNSIGNED NOT NULL,
  `permission_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(1, 21),
(1, 22),
(1, 23),
(1, 24),
(1, 25),
(1, 26),
(1, 27),
(1, 28),
(1, 29),
(1, 30),
(1, 31),
(1, 32),
(1, 33),
(1, 34),
(1, 35),
(1, 36),
(1, 37),
(1, 38),
(1, 39),
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(2, 5),
(2, 6),
(2, 7),
(2, 8),
(2, 9),
(2, 10),
(2, 11),
(2, 12),
(2, 14),
(2, 15),
(2, 16),
(2, 17),
(2, 18),
(2, 19),
(2, 20),
(2, 21),
(2, 22),
(2, 23),
(2, 24),
(2, 25),
(2, 26),
(2, 27),
(2, 28),
(2, 29),
(2, 30),
(2, 31),
(2, 33),
(2, 34),
(2, 35),
(2, 36),
(2, 37),
(2, 38),
(2, 39),
(3, 1),
(3, 2),
(3, 3),
(3, 4),
(3, 5),
(3, 6),
(3, 7),
(3, 8),
(3, 9),
(3, 11),
(3, 14),
(3, 16),
(3, 22),
(3, 23),
(3, 24),
(3, 25),
(3, 26),
(3, 27),
(3, 29),
(3, 31),
(4, 1),
(4, 2),
(4, 4),
(4, 6),
(4, 9),
(4, 14),
(4, 16),
(4, 22),
(5, 22),
(5, 23),
(6, 1),
(6, 2),
(6, 4),
(6, 5),
(6, 6),
(6, 7),
(6, 8),
(6, 9),
(6, 11),
(6, 14),
(6, 16),
(6, 22),
(6, 23),
(6, 24),
(6, 25),
(6, 26),
(6, 31),
(6, 32);

-- --------------------------------------------------------

--
-- Table structure for table `schema_migrations`
--

CREATE TABLE `schema_migrations` (
  `version` varchar(80) NOT NULL,
  `description` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `schema_migrations`
--

INSERT INTO `schema_migrations` (`version`, `description`, `applied_at`) VALUES
('001_upgrade_v1_1_0', 'Public landing page, appointments, queue, follow-ups, generic patients, doctor sign-off, inventory controls, corrections, and audit enhancements', '2026-11-01 03:48:38'),
('002_upgrade_v1_2_0', 'Landing galleries, policy acknowledgment, archives, and duplicate-submission safeguards', '2026-11-01 12:21:17');

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `staff_number` varchar(40) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `contact_number` varchar(40) DEFAULT NULL,
  `position` varchar(120) NOT NULL,
  `license_number` varchar(80) DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `user_id`, `staff_number`, `first_name`, `middle_name`, `last_name`, `contact_number`, `position`, `license_number`, `profile_picture`, `created_at`, `updated_at`) VALUES
('50910da7-8762-4747-b47a-b938fdf807d8', 'a393f297-d394-4520-af95-18083bf32a3d', 'KLD-ADM-001', 'Super', NULL, 'Admin', '09170000001', 'System Administrator', NULL, NULL, '2026-10-26 03:21:44', '2026-10-31 07:33:48'),
('c37c2b24-5eb3-4438-a0f8-c48ebd12b88e', '32be3719-9891-4392-b896-62a9e369c7be', '00000', 'Head', NULL, 'Doctor', NULL, 'Head Doctor', '77656', NULL, '2026-11-01 04:30:00', '2026-11-01 04:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `stock_count_items`
--

CREATE TABLE `stock_count_items` (
  `id` char(36) NOT NULL,
  `session_id` char(36) NOT NULL,
  `medicine_id` char(36) NOT NULL,
  `batch_id` char(36) NOT NULL,
  `expected_quantity` int(10) UNSIGNED NOT NULL,
  `counted_quantity` int(10) UNSIGNED DEFAULT NULL,
  `variance` int(11) DEFAULT NULL,
  `notes` varchar(1000) DEFAULT NULL,
  `adjustment_request_id` char(36) DEFAULT NULL,
  `counted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_count_sessions`
--

CREATE TABLE `stock_count_sessions` (
  `id` char(36) NOT NULL,
  `count_number` varchar(40) NOT NULL,
  `title` varchar(200) NOT NULL,
  `storage_location` varchar(180) DEFAULT NULL,
  `status` enum('OPEN','SUBMITTED','RECONCILED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  `opened_by` char(36) NOT NULL,
  `submitted_by` char(36) DEFAULT NULL,
  `reconciled_by` char(36) DEFAULT NULL,
  `notes` varchar(3000) DEFAULT NULL,
  `opened_at` datetime NOT NULL DEFAULT current_timestamp(),
  `submitted_at` datetime DEFAULT NULL,
  `reconciled_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_count_sessions`
--

INSERT INTO `stock_count_sessions` (`id`, `count_number`, `title`, `storage_location`, `status`, `opened_by`, `submitted_by`, `reconciled_by`, `notes`, `opened_at`, `submitted_at`, `reconciled_at`, `created_at`, `updated_at`) VALUES
('2c0e8d02-b38e-49a3-8ad5-b55f7869c139', 'CNT-20261101-5V4V23', 'meow', 'meow', 'OPEN', 'a393f297-d394-4520-af95-18083bf32a3d', NULL, NULL, NULL, '2026-11-01 12:17:24', NULL, NULL, '2026-11-01 04:17:24', '2026-11-01 04:17:24');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` char(36) NOT NULL,
  `student_number` varchar(40) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `birth_date` date NOT NULL,
  `sex` enum('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY') NOT NULL,
  `program` varchar(150) NOT NULL,
  `year_level` varchar(30) NOT NULL,
  `section` varchar(80) DEFAULT NULL,
  `registered_email` varchar(190) NOT NULL,
  `contact_number` varchar(40) DEFAULT NULL,
  `address` varchar(1000) DEFAULT NULL,
  `enrollment_status` enum('ACTIVE','INACTIVE','GRADUATED','TRANSFERRED','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `academic_year` varchar(20) NOT NULL,
  `semester` varchar(30) NOT NULL,
  `portal_eligible` tinyint(1) NOT NULL DEFAULT 1,
  `account_activation_status` enum('NOT_ACTIVATED','PENDING_VERIFICATION','ACTIVE','REVOKED') NOT NULL DEFAULT 'NOT_ACTIVATED',
  `account_linked` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `student_number`, `first_name`, `middle_name`, `last_name`, `birth_date`, `sex`, `program`, `year_level`, `section`, `registered_email`, `contact_number`, `address`, `enrollment_status`, `academic_year`, `semester`, `portal_eligible`, `account_activation_status`, `account_linked`, `created_at`, `updated_at`) VALUES
('9eb23708-59ef-4b37-a27f-0a3db5b91596', '2023-5-001659', 'DANIELA', 'ANN CRUZ', 'PALUSTRE', '2004-02-02', 'FEMALE', 'BSIS', '2ND YEAR', '206', 'dacpalustre@kld.edu.ph', '1234567890', 'Gentri', 'ACTIVE', '2026-2027', '2nd Semester', 1, 'ACTIVE', 1, '2026-10-31 07:43:53', '2026-10-31 08:18:29');

-- --------------------------------------------------------

--
-- Table structure for table `student_accounts`
--

CREATE TABLE `student_accounts` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `student_id` char(36) NOT NULL,
  `verified_email_at` datetime DEFAULT NULL,
  `activated_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_accounts`
--

INSERT INTO `student_accounts` (`id`, `user_id`, `student_id`, `verified_email_at`, `activated_at`, `created_at`) VALUES
('d274178a-e884-4d33-b378-6ed73b5c56bd', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', '9eb23708-59ef-4b37-a27f-0a3db5b91596', '2026-10-31 16:18:29', '2026-10-31 16:18:29', '2026-10-31 08:18:29');

-- --------------------------------------------------------

--
-- Table structure for table `student_enrollments`
--

CREATE TABLE `student_enrollments` (
  `id` char(36) NOT NULL,
  `student_id` char(36) NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `semester` varchar(30) NOT NULL,
  `program` varchar(150) NOT NULL,
  `year_level` varchar(30) NOT NULL,
  `section` varchar(80) DEFAULT NULL,
  `enrollment_status` enum('ACTIVE','INACTIVE','GRADUATED','TRANSFERRED','SUSPENDED') NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_enrollments`
--

INSERT INTO `student_enrollments` (`id`, `student_id`, `academic_year`, `semester`, `program`, `year_level`, `section`, `enrollment_status`, `is_current`, `created_at`) VALUES
('1b02a22c-cf2d-4690-8756-9b9bd0a3feb2', '9eb23708-59ef-4b37-a27f-0a3db5b91596', '2026-2027', '2nd Semester', 'BSIS', '2ND YEAR', '206', 'ACTIVE', 1, '2026-10-31 07:43:53');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(10) UNSIGNED NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` mediumtext DEFAULT NULL,
  `value_type` enum('STRING','NUMBER','BOOLEAN','JSON') NOT NULL DEFAULT 'STRING',
  `group_name` varchar(80) NOT NULL DEFAULT 'SYSTEM',
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `value_type`, `group_name`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'school_name', 'Kolehiyo ng Lungsod ng Dasmariñas', 'STRING', 'CLINIC', 'a393f297-d394-4520-af95-18083bf32a3d', '2026-10-26 03:21:46', '2026-10-31 06:30:52'),
(2, 'clinic_name', 'C-Spot', 'STRING', 'CLINIC', 'a393f297-d394-4520-af95-18083bf32a3d', '2026-10-26 03:21:46', '2026-10-31 06:30:52'),
(3, 'system_name', 'KLD School EMR', 'STRING', 'CLINIC', 'a393f297-d394-4520-af95-18083bf32a3d', '2026-10-26 03:21:46', '2026-10-31 06:30:52'),
(4, 'clinic_contact', '(046) 000-0000', 'STRING', 'CLINIC', 'a393f297-d394-4520-af95-18083bf32a3d', '2026-10-26 03:21:46', '2026-10-31 06:30:52'),
(5, 'clinic_address', 'KLD Campus, Dasmariñas City, Cavite', 'STRING', 'CLINIC', 'a393f297-d394-4520-af95-18083bf32a3d', '2026-10-26 03:21:46', '2026-10-31 06:30:52'),
(6, 'clinic_operating_info', 'Monday to Friday, 8:00 AM to 5:00 PM', 'STRING', 'CLINIC', 'a393f297-d394-4520-af95-18083bf32a3d', '2026-10-26 03:21:46', '2026-10-31 06:30:52'),
(7, 'institutional_logo', '/uploads/branding/logo-1793428263287-3jmmmk3l.png', 'STRING', 'CLINIC', 'a393f297-d394-4520-af95-18083bf32a3d', '2026-10-26 03:21:46', '2026-10-31 06:31:03'),
(8, 'system_version', '1.2.0', 'STRING', 'SYSTEM', NULL, '2026-10-26 03:21:46', '2026-11-01 12:21:17'),
(9, 'timezone', 'Asia/Manila', 'STRING', 'SYSTEM', 'a393f297-d394-4520-af95-18083bf32a3d', '2026-10-26 03:21:46', '2026-10-31 06:30:52'),
(10, 'date_format', 'MMM d, yyyy', 'STRING', 'SYSTEM', 'a393f297-d394-4520-af95-18083bf32a3d', '2026-10-26 03:21:46', '2026-10-31 06:30:52'),
(11, 'near_expiry_days', '60', 'NUMBER', 'SYSTEM', 'a393f297-d394-4520-af95-18083bf32a3d', '2026-10-26 03:21:46', '2026-10-31 06:30:52'),
(12, 'email_notifications_enabled', 'true', 'BOOLEAN', 'NOTIFICATIONS', 'a393f297-d394-4520-af95-18083bf32a3d', '2026-10-26 03:21:46', '2026-10-31 06:30:52');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `username` varchar(40) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int(10) UNSIGNED NOT NULL,
  `status` enum('ACTIVE','DISABLED','LOCKED','PENDING') NOT NULL DEFAULT 'ACTIVE',
  `must_change_password` tinyint(1) NOT NULL DEFAULT 0,
  `email_verified_at` datetime DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role_id`, `status`, `must_change_password`, `email_verified_at`, `password_changed_at`, `last_login_at`, `created_at`, `updated_at`) VALUES
('27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'dacpalustre', 'dacpalustre@kld.edu.ph', '$2b$12$6DVx4vivMHyVb23gpNrKv.qF13RA6OFYloNXXqCiEQZ3QgRKsyHQ.', 5, 'ACTIVE', 0, '2026-10-31 16:18:29', '2026-10-31 16:21:03', '2026-11-01 12:24:06', '2026-10-31 08:18:29', '2026-11-01 04:24:06'),
('32be3719-9891-4392-b896-62a9e369c7be', 'doctor', 'doctor@kld.edu.ph', '$2b$12$yUf.jWtFNIdmjKhZ/0cm1OQ7xlGv7yTLr.I/oKSGEAiECQ5z7Bj6C', 6, 'ACTIVE', 0, NULL, '2026-11-01 12:30:40', '2026-11-01 12:30:13', '2026-11-01 04:30:00', '2026-11-01 04:30:40'),
('a393f297-d394-4520-af95-18083bf32a3d', 'admin', 'admin@kldclinic.local', '$2b$12$zJQTgF/r3k/F.yxSOk0Sp.ukSTAPt5BDjCMTRgVy8cesUYhZh0jbu', 1, 'ACTIVE', 0, NULL, NULL, '2026-11-01 20:56:33', '2026-10-26 03:21:44', '2026-11-01 12:56:33');

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_sessions`
--

INSERT INTO `user_sessions` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `expires_at`, `revoked_at`, `created_at`) VALUES
('13722a6b-5e33-4818-8d2d-87ce567dab60', 'a393f297-d394-4520-af95-18083bf32a3d', '51b20ee8a6c96c0a2915e509d40587469b44f884401b11a715cf8944134c1fb7', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 23:42:42', '2026-11-01 15:51:55', '2026-11-01 07:42:42'),
('149403f8-8ecd-4d24-bf54-4267ae7f76e4', 'a393f297-d394-4520-af95-18083bf32a3d', 'e40dba35da82b381069e08fec0c78aa67e27a011ba23b57b31c3bc4ceb275f08', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 20:36:21', '2026-11-01 12:37:00', '2026-11-01 04:36:21'),
('1f5045b0-909e-492d-b19a-eeb645cd6364', 'a393f297-d394-4520-af95-18083bf32a3d', 'd3f894706c1d6c964d5fa4145848b1e77a9a2b9001695e186c2ab264d2d0323f', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-02 04:56:32', '2026-11-01 21:00:45', '2026-11-01 12:56:32'),
('235bb020-b72b-48bd-8742-d8791509b4a4', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'e95e48e09a6865c69802539c2cb0e95835849bba8a00a6dbce5d8f16eeb21496', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 00:18:54', '2026-10-31 16:18:57', '2026-10-31 08:18:54'),
('25c992e0-eeb4-4727-9e6c-4992e8fa7f29', 'a393f297-d394-4520-af95-18083bf32a3d', '44aa5a9b43f0640b3e57627555f06b44c10e5daa351fc80d31b0cb6882b0db69', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-10-31 23:52:52', '2026-10-31 15:54:09', '2026-10-31 07:52:52'),
('2a766593-a55b-4809-ac9b-4e48aa3dc7f1', '32be3719-9891-4392-b896-62a9e369c7be', 'e43c471665c711288b37698dc39601149d3c330cfb9d5e4cc4e31e0383253bd4', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 20:30:13', '2026-11-01 12:35:00', '2026-11-01 04:30:13'),
('2e7bd950-6494-4c17-94ac-809005881ba8', 'a393f297-d394-4520-af95-18083bf32a3d', '8dbef5d0a6599f698ab13d18127654f96e5592a952dcb3b8fddc76ab20f6f695', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 23:41:42', '2026-11-01 15:42:13', '2026-11-01 07:41:42'),
('5339560c-81d7-41ea-ac40-77ac1ce1f8af', 'a393f297-d394-4520-af95-18083bf32a3d', '834f55c369c74eea521c1b2f4665cde70cc28d29c900148f184b4067629911ce', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-10-31 23:41:58', '2026-10-31 15:43:58', '2026-10-31 07:41:58'),
('56d6f943-8c65-41f5-8b31-f0ff6227cc9f', 'a393f297-d394-4520-af95-18083bf32a3d', 'b316b31e50bd9fbea16db02c9be36914ea21df97dd2420f44a1c7c0486391771', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 20:25:02', '2026-11-01 12:30:04', '2026-11-01 04:25:02'),
('59a32869-ec8e-4fe9-b0f7-2b62a2ad30d7', 'a393f297-d394-4520-af95-18083bf32a3d', '7c536545230c29593f4567a40bc2d77a42b5d26fa54e32aaa2dc841fcb2ad279', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 04:19:07', '2026-10-31 20:38:13', '2026-10-31 12:19:07'),
('6bc5d4b0-8c73-4232-aed0-fcad14f4ab67', 'a393f297-d394-4520-af95-18083bf32a3d', '0611d1a76b35e5f4b49c7ad258a97e3db4620a44df2fdf16621619f2f1a1799b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 20:02:22', '2026-11-01 12:06:10', '2026-11-01 04:02:22'),
('720d6cf3-3bf1-4cd3-a8a4-3cbc75bea8b1', 'a393f297-d394-4520-af95-18083bf32a3d', '43528455791f79b38db1660ead170263156bbdd33fbc130d64834968e389f1ce', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-10-31 23:45:57', '2026-10-31 15:47:16', '2026-10-31 07:45:57'),
('7f2aad5c-af69-45f3-a7ed-045ed9d9c83b', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', '14ee64d1de325819c087408ded4a37d911d72c619ec3ea050b37bd3a905f48ca', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 20:24:06', '2026-11-01 12:24:50', '2026-11-01 04:24:06'),
('8ec06afc-a99e-4cb7-85dd-06a6f86dc868', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', 'febc4078bb29e5927e4de709faa296fba37fbf106e03b0fe998407370f73d2c5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 00:21:19', '2026-10-31 16:21:43', '2026-10-31 08:21:19'),
('97f6964c-dcb2-447d-a1b9-f2a340e81246', 'a393f297-d394-4520-af95-18083bf32a3d', '712e9ad4139678a5a46423505fe909571390f976ceb640c5417738cf56ec047a', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 00:38:08', '2026-10-31 17:35:10', '2026-10-31 08:38:08'),
('982535db-3f91-4c31-aec6-857b64bd01ac', 'a393f297-d394-4520-af95-18083bf32a3d', 'e0c1017859c8bed57501d34b5af18bf24f5f24ed97e85bc02bf2324f67117f2c', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 20:38:01', '2026-11-01 15:33:03', '2026-11-01 04:38:01'),
('a6484908-b697-43ae-a8f3-bb595fefd6e1', 'a393f297-d394-4520-af95-18083bf32a3d', '4368215f1f3c7d723fe06e3330b0e2fc9e4d5a6907f79dc8e89a82bec4e5f95b', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 20:07:20', '2026-11-01 12:23:20', '2026-11-01 04:07:20'),
('cbcdfe56-ebe2-42e4-be01-202655415669', 'a393f297-d394-4520-af95-18083bf32a3d', 'ca7f8e452a94316531a335586c484fe6c12ff71cb25f6610fa645c1ad7b913c7', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-02 04:53:46', '2026-11-01 20:55:22', '2026-11-01 12:53:46'),
('cd455b8f-f690-444f-9a71-c809b9bc3db2', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', '701bbda5e3f90b0f6da6c9c24da104488fa1153f0e56c2ed26dbd86538bc893a', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 00:18:41', '2026-10-31 16:18:44', '2026-10-31 08:18:41'),
('d4b71034-478a-46dc-91fb-23273697fe60', 'a393f297-d394-4520-af95-18083bf32a3d', '0cb1b2fb53607414356b24a3c2a488584ec0b58a4740fc250162b3f0a9a7154e', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 04:39:59', NULL, '2026-10-31 12:39:59'),
('f24420b4-c469-41f0-b3f7-4f368f0d65bb', '27dc4d14-ec08-4726-bdf2-869c1fc17e17', '4f4ea161d93e1893681a0165385ed375bf072252a0880b421d4b9594eec611ca', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '::1', '2026-11-01 20:06:45', '2026-11-01 12:07:11', '2026-11-01 04:06:45');

-- --------------------------------------------------------

--
-- Table structure for table `visits`
--

CREATE TABLE `visits` (
  `id` char(36) NOT NULL,
  `visit_number` varchar(40) NOT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `student_id` char(36) DEFAULT NULL,
  `visit_date` date NOT NULL,
  `visit_time` time NOT NULL,
  `visit_type` enum('WALK_IN','FOLLOW_UP','EMERGENCY','REFERRAL','MEDICAL_CLEARANCE','OTHER') NOT NULL,
  `reason` varchar(500) NOT NULL,
  `complaint` varchar(1000) NOT NULL,
  `accompanied_by` varchar(200) DEFAULT NULL,
  `priority` enum('NORMAL','MODERATE','URGENT','EMERGENCY') NOT NULL DEFAULT 'NORMAL',
  `notes` mediumtext DEFAULT NULL,
  `status` enum('REGISTERED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'REGISTERED',
  `registered_by` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `visits`
--

INSERT INTO `visits` (`id`, `visit_number`, `patient_id`, `student_id`, `visit_date`, `visit_time`, `visit_type`, `reason`, `complaint`, `accompanied_by`, `priority`, `notes`, `status`, `registered_by`, `created_at`, `updated_at`) VALUES
('2fa537c4-520e-4a58-a2fa-ca257d9dd02d', 'VIS-20261031-P4ODSV', '9eb23708-59ef-4b37-a27f-0a3db5b91596', '9eb23708-59ef-4b37-a27f-0a3db5b91596', '2026-10-31', '16:38:00', 'WALK_IN', 'Headache', 'Migraine', 'N/A', 'NORMAL', NULL, 'COMPLETED', '50910da7-8762-4747-b47a-b938fdf807d8', '2026-10-31 08:40:05', '2026-11-01 03:48:30'),
('bf5e6164-c904-4820-b3ea-210bc3d72434', 'VIS-20261101-2Q75NT', '9eb23708-59ef-4b37-a27f-0a3db5b91596', '9eb23708-59ef-4b37-a27f-0a3db5b91596', '2026-11-02', '09:00:00', 'OTHER', 'Appointment: Medical Clearance', 'clearance', NULL, 'NORMAL', 'Created from appointment APT-20261101-ND6OIJ', 'COMPLETED', '50910da7-8762-4747-b47a-b938fdf807d8', '2026-11-01 04:26:47', '2026-11-01 04:34:34');

-- --------------------------------------------------------

--
-- Table structure for table `vital_signs`
--

CREATE TABLE `vital_signs` (
  `id` char(36) NOT NULL,
  `consultation_id` char(36) NOT NULL,
  `temperature` decimal(5,2) DEFAULT NULL,
  `systolic` smallint(5) UNSIGNED DEFAULT NULL,
  `diastolic` smallint(5) UNSIGNED DEFAULT NULL,
  `heart_rate` smallint(5) UNSIGNED DEFAULT NULL,
  `respiratory_rate` smallint(5) UNSIGNED DEFAULT NULL,
  `oxygen_saturation` decimal(5,2) DEFAULT NULL,
  `weight` decimal(7,2) DEFAULT NULL,
  `height` decimal(7,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vital_signs`
--

INSERT INTO `vital_signs` (`id`, `consultation_id`, `temperature`, `systolic`, `diastolic`, `heart_rate`, `respiratory_rate`, `oxygen_saturation`, `weight`, `height`, `created_at`, `updated_at`) VALUES
('21b9c815-de6c-4735-b38c-bc6585080262', 'c6cd448d-c45e-43f0-88eb-3b7e6a59bbfb', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-11-01 04:32:47', '2026-11-01 04:34:26'),
('c3fb1472-8a68-4c41-81de-6f4a32ae2395', '63c25f32-8621-4af6-a23b-92e281b99a2b', 55.00, 55, 55, 55, 55, 55.00, 55.00, 55.00, '2026-10-31 09:21:50', '2026-10-31 09:22:15');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_medicine_inventory`
-- (See below for the actual view)
--
CREATE TABLE `v_medicine_inventory` (
`id` char(36)
,`medicine_code` varchar(40)
,`generic_name` varchar(180)
,`brand_name` varchar(180)
,`dosage_form` varchar(120)
,`unit` varchar(40)
,`minimum_stock` int(10) unsigned
,`is_active` tinyint(1)
,`category_name` varchar(120)
,`available_quantity` decimal(32,0)
,`total_quantity` decimal(32,0)
,`expired_quantity` decimal(32,0)
,`nearest_expiration` date
,`stock_status` varchar(15)
);

-- --------------------------------------------------------

--
-- Structure for view `v_medicine_inventory`
--
DROP TABLE IF EXISTS `v_medicine_inventory`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_medicine_inventory`  AS SELECT `m`.`id` AS `id`, `m`.`medicine_code` AS `medicine_code`, `m`.`generic_name` AS `generic_name`, `m`.`brand_name` AS `brand_name`, `m`.`dosage_form` AS `dosage_form`, `m`.`unit` AS `unit`, `m`.`minimum_stock` AS `minimum_stock`, `m`.`is_active` AS `is_active`, `mc`.`name` AS `category_name`, coalesce(sum(case when `mb`.`expiration_date` >= curdate() then `mb`.`quantity` else 0 end),0) AS `available_quantity`, coalesce(sum(`mb`.`quantity`),0) AS `total_quantity`, coalesce(sum(case when `mb`.`quantity` > 0 and `mb`.`expiration_date` < curdate() then `mb`.`quantity` else 0 end),0) AS `expired_quantity`, min(case when `mb`.`quantity` > 0 and `mb`.`expiration_date` >= curdate() then `mb`.`expiration_date` end) AS `nearest_expiration`, CASE WHEN `m`.`is_active` = 0 THEN 'INACTIVE' WHEN coalesce(sum(case when `mb`.`expiration_date` >= curdate() then `mb`.`quantity` else 0 end),0) = 0 THEN 'OUT_OF_STOCK' WHEN coalesce(sum(case when `mb`.`expiration_date` >= curdate() then `mb`.`quantity` else 0 end),0) <= `m`.`minimum_stock` THEN 'LOW_STOCK' WHEN min(case when `mb`.`quantity` > 0 AND `mb`.`expiration_date` >= curdate() then `mb`.`expiration_date` end) <= curdate() + interval 60 day THEN 'NEAR_EXPIRATION' ELSE 'AVAILABLE' END AS `stock_status` FROM ((`medicines` `m` left join `medicine_categories` `mc` on(`mc`.`id` = `m`.`category_id`)) left join `medicine_batches` `mb` on(`mb`.`medicine_id` = `m`.`id`)) GROUP BY `m`.`id`, `m`.`medicine_code`, `m`.`generic_name`, `m`.`brand_name`, `m`.`dosage_form`, `m`.`unit`, `m`.`minimum_stock`, `m`.`is_active`, `mc`.`name` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_activity_actor` (`actor_user_id`,`created_at`),
  ADD KEY `idx_activity_action` (`action`,`created_at`),
  ADD KEY `idx_activity_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_activity_request` (`request_id`);

--
-- Indexes for table `api_idempotency_keys`
--
ALTER TABLE `api_idempotency_keys`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_api_idempotency_user_scope_key` (`user_id`,`scope`,`idempotency_key`),
  ADD KEY `idx_api_idempotency_expiry` (`expires_at`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_appointments_number` (`appointment_number`),
  ADD UNIQUE KEY `uq_appointments_idempotency` (`idempotency_key`),
  ADD UNIQUE KEY `uq_appointments_visit` (`visit_id`),
  ADD KEY `idx_appointments_schedule` (`service_id`,`requested_start`,`status`),
  ADD KEY `idx_appointments_patient` (`patient_id`,`created_at`),
  ADD KEY `idx_appointments_status_date` (`status`,`requested_start`),
  ADD KEY `fk_appointments_request_user` (`requested_by_user_id`),
  ADD KEY `fk_appointments_review_user` (`reviewed_by_user_id`);

--
-- Indexes for table `appointment_reminders`
--
ALTER TABLE `appointment_reminders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_appointment_reminder` (`appointment_id`,`reminder_type`,`channel`),
  ADD KEY `idx_appointment_reminders_due` (`status`,`scheduled_for`);

--
-- Indexes for table `appointment_services`
--
ALTER TABLE `appointment_services`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_appointment_service_name` (`name`),
  ADD KEY `idx_appointment_service_active` (`is_active`,`sort_order`);

--
-- Indexes for table `appointment_status_history`
--
ALTER TABLE `appointment_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_appointment_history` (`appointment_id`,`created_at`),
  ADD KEY `fk_appointment_history_user` (`changed_by_user_id`);

--
-- Indexes for table `archive_events`
--
ALTER TABLE `archive_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_archive_events_entity` (`entity_type`,`entity_id`,`created_at`),
  ADD KEY `idx_archive_events_actor` (`actor_user_id`,`created_at`);

--
-- Indexes for table `clinic_forms`
--
ALTER TABLE `clinic_forms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_clinic_forms_active` (`is_active`,`updated_at`),
  ADD KEY `fk_clinic_forms_user` (`created_by`);

--
-- Indexes for table `clinic_form_versions`
--
ALTER TABLE `clinic_form_versions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_clinic_form_version` (`form_id`,`version`),
  ADD KEY `idx_clinic_form_current` (`form_id`,`is_current`),
  ADD KEY `fk_form_versions_user` (`created_by`);

--
-- Indexes for table `clinic_queue_entries`
--
ALTER TABLE `clinic_queue_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_queue_number_date` (`queue_date`,`queue_number`),
  ADD UNIQUE KEY `uq_queue_visit` (`visit_id`),
  ADD UNIQUE KEY `uq_queue_appointment` (`appointment_id`),
  ADD UNIQUE KEY `uq_queue_idempotency` (`idempotency_key`),
  ADD KEY `idx_queue_daily_status` (`queue_date`,`status`,`priority`,`checked_in_at`),
  ADD KEY `fk_queue_patient` (`patient_id`),
  ADD KEY `fk_queue_checked_by` (`checked_in_by`),
  ADD KEY `fk_queue_called_by` (`called_by`);

--
-- Indexes for table `clinic_schedules`
--
ALTER TABLE `clinic_schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_clinic_schedule` (`service_id`,`day_of_week`,`start_time`,`end_time`),
  ADD KEY `idx_clinic_schedule_active` (`service_id`,`day_of_week`,`is_active`);

--
-- Indexes for table `clinic_unavailable_dates`
--
ALTER TABLE `clinic_unavailable_dates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_unavailable_date` (`unavailable_date`,`service_id`),
  ADD KEY `fk_unavailable_service` (`service_id`),
  ADD KEY `fk_unavailable_user` (`created_by`);

--
-- Indexes for table `consultations`
--
ALTER TABLE `consultations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_consultations_number` (`consultation_number`),
  ADD UNIQUE KEY `uq_consultations_visit` (`visit_id`),
  ADD KEY `idx_consultations_student_status` (`student_id`,`status`),
  ADD KEY `idx_consultations_staff_date` (`staff_id`,`created_at`),
  ADD KEY `fk_consultations_released_by` (`released_by`),
  ADD KEY `idx_consultations_patient_status` (`patient_id`,`status`),
  ADD KEY `idx_consultations_doctor_status` (`doctor_staff_id`,`status`,`completed_at`),
  ADD KEY `fk_consultations_prepared_by` (`prepared_by_staff_id`),
  ADD KEY `fk_consultations_signed_user` (`signed_off_by_user_id`);

--
-- Indexes for table `doctor_profiles`
--
ALTER TABLE `doctor_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_doctor_staff` (`staff_id`),
  ADD UNIQUE KEY `uq_doctor_license` (`professional_license_number`);

--
-- Indexes for table `email_delivery_logs`
--
ALTER TABLE `email_delivery_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email_delivery_queue` (`queue_id`,`attempted_at`);

--
-- Indexes for table `email_queue`
--
ALTER TABLE `email_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email_queue_status` (`status`,`next_attempt_at`),
  ADD KEY `idx_email_queue_related` (`related_type`,`related_id`);

--
-- Indexes for table `email_verification_tokens`
--
ALTER TABLE `email_verification_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_email_verification_hash` (`token_hash`),
  ADD KEY `idx_email_verification_student` (`student_id`,`expires_at`);

--
-- Indexes for table `emergency_contacts`
--
ALTER TABLE `emergency_contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_emergency_contacts_student` (`student_id`,`is_primary`),
  ADD KEY `idx_emergency_contacts_patient` (`patient_id`,`is_primary`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_employees_number` (`employee_number`),
  ADD KEY `idx_employees_name` (`last_name`,`first_name`),
  ADD KEY `idx_employees_department_status` (`department`,`employment_status`),
  ADD KEY `fk_employees_category` (`category_id`);

--
-- Indexes for table `employee_categories`
--
ALTER TABLE `employee_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_employee_category_name` (`name`);

--
-- Indexes for table `follow_ups`
--
ALTER TABLE `follow_ups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_followup_number` (`follow_up_number`),
  ADD UNIQUE KEY `uq_followup_appointment` (`appointment_id`),
  ADD KEY `idx_followups_patient_status` (`patient_id`,`status`,`target_date`),
  ADD KEY `idx_followups_consultation` (`consultation_id`,`target_date`),
  ADD KEY `fk_followup_staff` (`assigned_staff_id`),
  ADD KEY `fk_followup_doctor` (`assigned_doctor_staff_id`),
  ADD KEY `fk_followup_user` (`created_by_user_id`);

--
-- Indexes for table `follow_up_reminders`
--
ALTER TABLE `follow_up_reminders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_followup_reminder` (`follow_up_id`,`reminder_type`,`channel`);

--
-- Indexes for table `form_assignments`
--
ALTER TABLE `form_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_form_assignment` (`form_version_id`,`student_id`),
  ADD KEY `idx_form_assignments_student_status` (`student_id`,`status`),
  ADD KEY `fk_form_assignments_user` (`assigned_by`);

--
-- Indexes for table `form_submissions`
--
ALTER TABLE `form_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_form_submissions_assignment` (`assignment_id`),
  ADD UNIQUE KEY `uq_form_submissions_reference` (`reference_number`),
  ADD KEY `idx_form_submissions_student` (`student_id`,`submitted_at`),
  ADD KEY `fk_form_submissions_version` (`form_version_id`);

--
-- Indexes for table `form_submission_answers`
--
ALTER TABLE `form_submission_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_form_answers_submission` (`submission_id`);

--
-- Indexes for table `guardians`
--
ALTER TABLE `guardians`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_guardians_student` (`student_id`,`is_primary`),
  ADD KEY `idx_guardians_patient` (`patient_id`,`is_primary`);

--
-- Indexes for table `inventory_adjustment_requests`
--
ALTER TABLE `inventory_adjustment_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_inventory_adjustment_number` (`adjustment_number`),
  ADD KEY `idx_adjustment_status` (`status`,`requested_at`),
  ADD KEY `idx_adjustment_batch` (`batch_id`,`created_at`),
  ADD KEY `fk_adjustment_medicine` (`medicine_id`),
  ADD KEY `fk_adjustment_requester` (`requested_by`),
  ADD KEY `fk_adjustment_approver` (`approved_by`),
  ADD KEY `fk_adjustment_stock_count_item` (`stock_count_item_id`);

--
-- Indexes for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_inventory_transactions_medicine` (`medicine_id`,`created_at`),
  ADD KEY `idx_inventory_transactions_batch` (`batch_id`,`created_at`),
  ADD KEY `fk_inventory_transactions_user` (`created_by`);

--
-- Indexes for table `landing_content_items`
--
ALTER TABLE `landing_content_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_landing_items_public` (`section_type`,`is_published`,`sort_order`),
  ADD KEY `fk_landing_item_creator` (`created_by`),
  ADD KEY `fk_landing_item_updater` (`updated_by`);

--
-- Indexes for table `landing_content_media`
--
ALTER TABLE `landing_content_media`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_landing_media_item_path` (`content_item_id`,`file_path`),
  ADD KEY `idx_landing_media_item` (`content_item_id`,`is_cover`,`sort_order`),
  ADD KEY `fk_landing_media_creator` (`created_by`);

--
-- Indexes for table `landing_page_config`
--
ALTER TABLE `landing_page_config`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_landing_config_user` (`updated_by`);

--
-- Indexes for table `medical_attachments`
--
ALTER TABLE `medical_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_attachments_patient` (`patient_id`,`created_at`),
  ADD KEY `fk_attachments_visit` (`visit_id`),
  ADD KEY `fk_attachments_consultation` (`consultation_id`),
  ADD KEY `fk_attachments_user` (`uploaded_by`);

--
-- Indexes for table `medical_record_revisions`
--
ALTER TABLE `medical_record_revisions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_medical_revisions_consultation` (`consultation_id`,`created_at`),
  ADD KEY `fk_medical_revisions_user` (`revised_by`);

--
-- Indexes for table `medicines`
--
ALTER TABLE `medicines`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_medicines_code` (`medicine_code`),
  ADD KEY `idx_medicines_name` (`generic_name`,`brand_name`),
  ADD KEY `idx_medicines_category` (`category_id`,`is_active`),
  ADD KEY `idx_medicines_archive` (`archived_at`,`is_active`),
  ADD KEY `fk_medicines_archived_by` (`archived_by`),
  ADD KEY `fk_medicines_unarchived_by` (`unarchived_by`);

--
-- Indexes for table `medicine_batches`
--
ALTER TABLE `medicine_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_medicine_batch` (`medicine_id`,`batch_number`),
  ADD KEY `idx_medicine_batches_expiry` (`expiration_date`,`quantity`),
  ADD KEY `idx_medicine_batches_stock` (`medicine_id`,`quantity`,`expiration_date`);

--
-- Indexes for table `medicine_categories`
--
ALTER TABLE `medicine_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_medicine_categories_name` (`name`);

--
-- Indexes for table `medicine_issuances`
--
ALTER TABLE `medicine_issuances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_medicine_issuances_number` (`issuance_number`),
  ADD KEY `idx_medicine_issuances_student` (`student_id`,`issued_at`),
  ADD KEY `idx_medicine_issuances_staff` (`issued_by`,`issued_at`),
  ADD KEY `fk_medicine_issuances_visit` (`visit_id`),
  ADD KEY `fk_medicine_issuances_consultation` (`consultation_id`),
  ADD KEY `fk_medicine_issuances_voided_by` (`voided_by`),
  ADD KEY `idx_medicine_issuances_patient` (`patient_id`,`issued_at`);

--
-- Indexes for table `medicine_issuance_items`
--
ALTER TABLE `medicine_issuance_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_issuance_items_issuance` (`issuance_id`),
  ADD KEY `idx_issuance_items_medicine` (`medicine_id`,`created_at`),
  ADD KEY `fk_issuance_items_batch` (`batch_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user_unread` (`user_id`,`is_read`,`created_at`),
  ADD KEY `idx_notifications_role` (`role_id`,`created_at`),
  ADD KEY `fk_notifications_student` (`student_id`),
  ADD KEY `idx_notifications_patient` (`patient_id`,`created_at`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_password_reset_hash` (`token_hash`),
  ADD KEY `idx_password_reset_user` (`user_id`,`expires_at`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_patients_record_number` (`record_number`),
  ADD UNIQUE KEY `uq_patients_student` (`student_id`),
  ADD UNIQUE KEY `uq_patients_employee` (`employee_id`),
  ADD KEY `idx_patients_type_status` (`patient_type`,`status`),
  ADD KEY `idx_patients_archive` (`archived_at`,`patient_type`,`status`),
  ADD KEY `fk_patients_archived_by` (`archived_by`),
  ADD KEY `fk_patients_unarchived_by` (`unarchived_by`);

--
-- Indexes for table `patient_correction_requests`
--
ALTER TABLE `patient_correction_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_patient_correction_number` (`request_number`),
  ADD KEY `idx_patient_correction_patient` (`patient_id`,`status`,`submitted_at`),
  ADD KEY `idx_patient_correction_review` (`status`,`submitted_at`),
  ADD KEY `fk_patient_correction_requester` (`requested_by_user_id`),
  ADD KEY `fk_patient_correction_reviewer` (`reviewed_by_user_id`);

--
-- Indexes for table `patient_measurements`
--
ALTER TABLE `patient_measurements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_patient_measurements_date` (`patient_id`,`measured_on`),
  ADD KEY `fk_measurements_user` (`submitted_by_user_id`),
  ADD KEY `fk_measurements_staff` (`recorded_by_staff_id`);

--
-- Indexes for table `patient_medical_history`
--
ALTER TABLE `patient_medical_history`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_medical_history_student` (`student_id`),
  ADD UNIQUE KEY `uq_medical_history_patient` (`patient_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_permissions_code` (`code`);

--
-- Indexes for table `physical_assessments`
--
ALTER TABLE `physical_assessments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_physical_assessment_consultation` (`consultation_id`);

--
-- Indexes for table `policy_acceptances`
--
ALTER TABLE `policy_acceptances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_policy_acceptance_user_document` (`user_id`,`document_id`),
  ADD KEY `idx_policy_acceptance_user_type` (`user_id`,`document_type`,`accepted_at`),
  ADD KEY `fk_policy_acceptance_document` (`document_id`);

--
-- Indexes for table `policy_documents`
--
ALTER TABLE `policy_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_policy_type_version` (`document_type`,`version`),
  ADD KEY `idx_policy_current` (`document_type`,`status`,`published_at`),
  ADD KEY `fk_policy_creator` (`created_by`),
  ADD KEY `fk_policy_updater` (`updated_by`);

--
-- Indexes for table `queue_daily_counters`
--
ALTER TABLE `queue_daily_counters`
  ADD PRIMARY KEY (`queue_date`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_roles_code` (`code`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `fk_role_permissions_permission` (`permission_id`);

--
-- Indexes for table `schema_migrations`
--
ALTER TABLE `schema_migrations`
  ADD PRIMARY KEY (`version`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_staff_user` (`user_id`),
  ADD UNIQUE KEY `uq_staff_number` (`staff_number`),
  ADD KEY `idx_staff_name` (`last_name`,`first_name`);

--
-- Indexes for table `stock_count_items`
--
ALTER TABLE `stock_count_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_stock_count_batch` (`session_id`,`batch_id`),
  ADD KEY `idx_stock_count_item_variance` (`session_id`,`variance`),
  ADD KEY `fk_stock_count_item_medicine` (`medicine_id`),
  ADD KEY `fk_stock_count_item_batch` (`batch_id`),
  ADD KEY `fk_stock_count_item_adjustment` (`adjustment_request_id`);

--
-- Indexes for table `stock_count_sessions`
--
ALTER TABLE `stock_count_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_stock_count_number` (`count_number`),
  ADD KEY `idx_stock_count_status` (`status`,`opened_at`),
  ADD KEY `fk_stock_count_opener` (`opened_by`),
  ADD KEY `fk_stock_count_submitter` (`submitted_by`),
  ADD KEY `fk_stock_count_reconciler` (`reconciled_by`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_students_number` (`student_number`),
  ADD KEY `idx_students_name` (`last_name`,`first_name`),
  ADD KEY `idx_students_program_year` (`program`,`year_level`),
  ADD KEY `idx_students_status` (`enrollment_status`,`portal_eligible`),
  ADD KEY `idx_students_email` (`registered_email`);

--
-- Indexes for table `student_accounts`
--
ALTER TABLE `student_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_student_accounts_user` (`user_id`),
  ADD UNIQUE KEY `uq_student_accounts_student` (`student_id`);

--
-- Indexes for table `student_enrollments`
--
ALTER TABLE `student_enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_student_enrollment_term` (`student_id`,`academic_year`,`semester`),
  ADD KEY `idx_student_enrollment_current` (`student_id`,`is_current`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_system_settings_key` (`setting_key`),
  ADD KEY `fk_system_settings_user` (`updated_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_username` (`username`),
  ADD UNIQUE KEY `uq_users_email` (`email`),
  ADD KEY `idx_users_role_status` (`role_id`,`status`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_sessions_token` (`token_hash`),
  ADD KEY `idx_user_sessions_user_active` (`user_id`,`revoked_at`,`expires_at`);

--
-- Indexes for table `visits`
--
ALTER TABLE `visits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_visits_number` (`visit_number`),
  ADD KEY `idx_visits_student_date` (`student_id`,`visit_date`,`visit_time`),
  ADD KEY `idx_visits_date_status` (`visit_date`,`status`),
  ADD KEY `idx_visits_priority` (`priority`,`visit_date`),
  ADD KEY `fk_visits_staff` (`registered_by`),
  ADD KEY `idx_visits_patient_date` (`patient_id`,`visit_date`,`visit_time`);

--
-- Indexes for table `vital_signs`
--
ALTER TABLE `vital_signs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_vital_signs_consultation` (`consultation_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=230;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `fk_activity_user` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `api_idempotency_keys`
--
ALTER TABLE `api_idempotency_keys`
  ADD CONSTRAINT `fk_api_idempotency_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `fk_appointments_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `fk_appointments_request_user` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_appointments_review_user` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_appointments_service` FOREIGN KEY (`service_id`) REFERENCES `appointment_services` (`id`),
  ADD CONSTRAINT `fk_appointments_visit` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `appointment_reminders`
--
ALTER TABLE `appointment_reminders`
  ADD CONSTRAINT `fk_appointment_reminder_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `appointment_status_history`
--
ALTER TABLE `appointment_status_history`
  ADD CONSTRAINT `fk_appointment_history_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_appointment_history_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `archive_events`
--
ALTER TABLE `archive_events`
  ADD CONSTRAINT `fk_archive_events_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `clinic_forms`
--
ALTER TABLE `clinic_forms`
  ADD CONSTRAINT `fk_clinic_forms_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `clinic_form_versions`
--
ALTER TABLE `clinic_form_versions`
  ADD CONSTRAINT `fk_form_versions_form` FOREIGN KEY (`form_id`) REFERENCES `clinic_forms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_form_versions_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `clinic_queue_entries`
--
ALTER TABLE `clinic_queue_entries`
  ADD CONSTRAINT `fk_queue_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_queue_called_by` FOREIGN KEY (`called_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_queue_checked_by` FOREIGN KEY (`checked_in_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_queue_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `fk_queue_visit` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`id`);

--
-- Constraints for table `clinic_schedules`
--
ALTER TABLE `clinic_schedules`
  ADD CONSTRAINT `fk_clinic_schedule_service` FOREIGN KEY (`service_id`) REFERENCES `appointment_services` (`id`);

--
-- Constraints for table `clinic_unavailable_dates`
--
ALTER TABLE `clinic_unavailable_dates`
  ADD CONSTRAINT `fk_unavailable_service` FOREIGN KEY (`service_id`) REFERENCES `appointment_services` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_unavailable_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `consultations`
--
ALTER TABLE `consultations`
  ADD CONSTRAINT `fk_consultations_doctor` FOREIGN KEY (`doctor_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_consultations_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `fk_consultations_prepared_by` FOREIGN KEY (`prepared_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_consultations_released_by` FOREIGN KEY (`released_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_consultations_signed_user` FOREIGN KEY (`signed_off_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_consultations_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`),
  ADD CONSTRAINT `fk_consultations_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `fk_consultations_visit` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`id`);

--
-- Constraints for table `doctor_profiles`
--
ALTER TABLE `doctor_profiles`
  ADD CONSTRAINT `fk_doctor_profile_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `email_delivery_logs`
--
ALTER TABLE `email_delivery_logs`
  ADD CONSTRAINT `fk_email_delivery_queue` FOREIGN KEY (`queue_id`) REFERENCES `email_queue` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `email_verification_tokens`
--
ALTER TABLE `email_verification_tokens`
  ADD CONSTRAINT `fk_email_verification_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `emergency_contacts`
--
ALTER TABLE `emergency_contacts`
  ADD CONSTRAINT `fk_emergency_contacts_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_emergency_contacts_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `fk_employees_category` FOREIGN KEY (`category_id`) REFERENCES `employee_categories` (`id`);

--
-- Constraints for table `follow_ups`
--
ALTER TABLE `follow_ups`
  ADD CONSTRAINT `fk_followup_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_followup_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`),
  ADD CONSTRAINT `fk_followup_doctor` FOREIGN KEY (`assigned_doctor_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_followup_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `fk_followup_staff` FOREIGN KEY (`assigned_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_followup_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `follow_up_reminders`
--
ALTER TABLE `follow_up_reminders`
  ADD CONSTRAINT `fk_followup_reminder_followup` FOREIGN KEY (`follow_up_id`) REFERENCES `follow_ups` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `form_assignments`
--
ALTER TABLE `form_assignments`
  ADD CONSTRAINT `fk_form_assignments_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `fk_form_assignments_user` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_form_assignments_version` FOREIGN KEY (`form_version_id`) REFERENCES `clinic_form_versions` (`id`);

--
-- Constraints for table `form_submissions`
--
ALTER TABLE `form_submissions`
  ADD CONSTRAINT `fk_form_submissions_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `form_assignments` (`id`),
  ADD CONSTRAINT `fk_form_submissions_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `fk_form_submissions_version` FOREIGN KEY (`form_version_id`) REFERENCES `clinic_form_versions` (`id`);

--
-- Constraints for table `form_submission_answers`
--
ALTER TABLE `form_submission_answers`
  ADD CONSTRAINT `fk_form_answers_submission` FOREIGN KEY (`submission_id`) REFERENCES `form_submissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `guardians`
--
ALTER TABLE `guardians`
  ADD CONSTRAINT `fk_guardians_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_guardians_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory_adjustment_requests`
--
ALTER TABLE `inventory_adjustment_requests`
  ADD CONSTRAINT `fk_adjustment_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_adjustment_batch` FOREIGN KEY (`batch_id`) REFERENCES `medicine_batches` (`id`),
  ADD CONSTRAINT `fk_adjustment_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  ADD CONSTRAINT `fk_adjustment_requester` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_adjustment_stock_count_item` FOREIGN KEY (`stock_count_item_id`) REFERENCES `stock_count_items` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `fk_inventory_transactions_batch` FOREIGN KEY (`batch_id`) REFERENCES `medicine_batches` (`id`),
  ADD CONSTRAINT `fk_inventory_transactions_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  ADD CONSTRAINT `fk_inventory_transactions_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `landing_content_items`
--
ALTER TABLE `landing_content_items`
  ADD CONSTRAINT `fk_landing_item_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_landing_item_updater` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `landing_content_media`
--
ALTER TABLE `landing_content_media`
  ADD CONSTRAINT `fk_landing_media_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_landing_media_item` FOREIGN KEY (`content_item_id`) REFERENCES `landing_content_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `landing_page_config`
--
ALTER TABLE `landing_page_config`
  ADD CONSTRAINT `fk_landing_config_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `medical_attachments`
--
ALTER TABLE `medical_attachments`
  ADD CONSTRAINT `fk_attachments_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_attachments_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_attachments_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_attachments_visit` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `medical_record_revisions`
--
ALTER TABLE `medical_record_revisions`
  ADD CONSTRAINT `fk_medical_revisions_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_medical_revisions_user` FOREIGN KEY (`revised_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `medicines`
--
ALTER TABLE `medicines`
  ADD CONSTRAINT `fk_medicines_archived_by` FOREIGN KEY (`archived_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_medicines_category` FOREIGN KEY (`category_id`) REFERENCES `medicine_categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_medicines_unarchived_by` FOREIGN KEY (`unarchived_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `medicine_batches`
--
ALTER TABLE `medicine_batches`
  ADD CONSTRAINT `fk_medicine_batches_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`);

--
-- Constraints for table `medicine_issuances`
--
ALTER TABLE `medicine_issuances`
  ADD CONSTRAINT `fk_medicine_issuances_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_medicine_issuances_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `fk_medicine_issuances_staff` FOREIGN KEY (`issued_by`) REFERENCES `staff` (`id`),
  ADD CONSTRAINT `fk_medicine_issuances_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `fk_medicine_issuances_visit` FOREIGN KEY (`visit_id`) REFERENCES `visits` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_medicine_issuances_voided_by` FOREIGN KEY (`voided_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `medicine_issuance_items`
--
ALTER TABLE `medicine_issuance_items`
  ADD CONSTRAINT `fk_issuance_items_batch` FOREIGN KEY (`batch_id`) REFERENCES `medicine_batches` (`id`),
  ADD CONSTRAINT `fk_issuance_items_issuance` FOREIGN KEY (`issuance_id`) REFERENCES `medicine_issuances` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_issuance_items_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notifications_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notifications_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `fk_patients_archived_by` FOREIGN KEY (`archived_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_patients_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_patients_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_patients_unarchived_by` FOREIGN KEY (`unarchived_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `patient_correction_requests`
--
ALTER TABLE `patient_correction_requests`
  ADD CONSTRAINT `fk_patient_correction_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_patient_correction_requester` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_patient_correction_reviewer` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `patient_measurements`
--
ALTER TABLE `patient_measurements`
  ADD CONSTRAINT `fk_measurements_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_measurements_staff` FOREIGN KEY (`recorded_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_measurements_user` FOREIGN KEY (`submitted_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `patient_medical_history`
--
ALTER TABLE `patient_medical_history`
  ADD CONSTRAINT `fk_medical_history_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_medical_history_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `physical_assessments`
--
ALTER TABLE `physical_assessments`
  ADD CONSTRAINT `fk_physical_assessment_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `policy_acceptances`
--
ALTER TABLE `policy_acceptances`
  ADD CONSTRAINT `fk_policy_acceptance_document` FOREIGN KEY (`document_id`) REFERENCES `policy_documents` (`id`),
  ADD CONSTRAINT `fk_policy_acceptance_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `policy_documents`
--
ALTER TABLE `policy_documents`
  ADD CONSTRAINT `fk_policy_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_policy_updater` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `fk_staff_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_count_items`
--
ALTER TABLE `stock_count_items`
  ADD CONSTRAINT `fk_stock_count_item_adjustment` FOREIGN KEY (`adjustment_request_id`) REFERENCES `inventory_adjustment_requests` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_stock_count_item_batch` FOREIGN KEY (`batch_id`) REFERENCES `medicine_batches` (`id`),
  ADD CONSTRAINT `fk_stock_count_item_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  ADD CONSTRAINT `fk_stock_count_item_session` FOREIGN KEY (`session_id`) REFERENCES `stock_count_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_count_sessions`
--
ALTER TABLE `stock_count_sessions`
  ADD CONSTRAINT `fk_stock_count_opener` FOREIGN KEY (`opened_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_stock_count_reconciler` FOREIGN KEY (`reconciled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_stock_count_submitter` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `student_accounts`
--
ALTER TABLE `student_accounts`
  ADD CONSTRAINT `fk_student_accounts_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_student_accounts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_enrollments`
--
ALTER TABLE `student_enrollments`
  ADD CONSTRAINT `fk_student_enrollments_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `fk_system_settings_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `visits`
--
ALTER TABLE `visits`
  ADD CONSTRAINT `fk_visits_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `fk_visits_staff` FOREIGN KEY (`registered_by`) REFERENCES `staff` (`id`),
  ADD CONSTRAINT `fk_visits_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`);

--
-- Constraints for table `vital_signs`
--
ALTER TABLE `vital_signs`
  ADD CONSTRAINT `fk_vital_signs_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
