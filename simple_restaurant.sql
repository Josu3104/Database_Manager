-- Simple Restaurant Database - SQL Server
-- =====================================================
-- Clean start
-- =====================================================
IF EXISTS (SELECT * FROM sys.schemas WHERE name = 'Restaurant')
BEGIN
    DROP SCHEMA Restaurant;
END
GO

CREATE SCHEMA Restaurant;
GO

-- =====================================================
-- TABLES (in dependency order)
-- =====================================================

-- 1. Categories (no dependencies)
CREATE TABLE Restaurant.Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(50) NOT NULL,
    Description NVARCHAR(200)
);

-- 2. Staff (no dependencies)
CREATE TABLE Restaurant.Staff (
    StaffID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Position NVARCHAR(50) NOT NULL,
    HourlyWage DECIMAL(8,2),
    HireDate DATE DEFAULT GETDATE()
);

-- 3. Tables (no dependencies)
CREATE TABLE Restaurant.RestaurantTables (
    TableID INT IDENTITY(1,1) PRIMARY KEY,
    TableNumber NVARCHAR(10) NOT NULL UNIQUE,
    Capacity INT NOT NULL,
    IsActive BIT DEFAULT 1
);

-- 4. Customers (no dependencies)
CREATE TABLE Restaurant.Customers (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(50),
    LastName NVARCHAR(50),
    Phone NVARCHAR(20),
    Email NVARCHAR(100)
);

-- 5. Menu Items (depends on Categories)
CREATE TABLE Restaurant.MenuItems (
    ItemID INT IDENTITY(1,1) PRIMARY KEY,
    ItemName NVARCHAR(100) NOT NULL,
    CategoryID INT NOT NULL,
    Price DECIMAL(8,2) NOT NULL,
    Description NVARCHAR(200),
    IsAvailable BIT DEFAULT 1,
    FOREIGN KEY (CategoryID) REFERENCES Restaurant.Categories(CategoryID)
);

-- 6. Orders (depends on Customers, Tables, Staff)
CREATE TABLE Restaurant.Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT,
    TableID INT,
    ServerID INT NOT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    OrderStatus NVARCHAR(20) DEFAULT 'Pending',
    TotalAmount DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (CustomerID) REFERENCES Restaurant.Customers(CustomerID),
    FOREIGN KEY (TableID) REFERENCES Restaurant.RestaurantTables(TableID),
    FOREIGN KEY (ServerID) REFERENCES Restaurant.Staff(StaffID)
);

-- 7. Order Items (depends on Orders and MenuItems - LAST)
CREATE TABLE Restaurant.OrderItems (
    OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ItemID INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    UnitPrice DECIMAL(8,2) NOT NULL,
    LineTotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES Restaurant.Orders(OrderID),
    FOREIGN KEY (ItemID) REFERENCES Restaurant.MenuItems(ItemID)
);

-- =====================================================
-- SAMPLE DATA (in correct order)
-- =====================================================

-- 1. Categories first
INSERT INTO Restaurant.Categories (CategoryName, Description) VALUES 
('Appetizers', 'Starters and small plates'),
('Main Courses', 'Primary dishes'),
('Desserts', 'Sweet treats'),
('Beverages', 'Drinks and refreshments');

-- 2. Staff
INSERT INTO Restaurant.Staff (FirstName, LastName, Position, HourlyWage) VALUES 
('John', 'Smith', 'Server', 15.00),
('Sarah', 'Johnson', 'Server', 15.00),
('Mike', 'Wilson', 'Chef', 22.00),
('Lisa', 'Brown', 'Manager', 25.00);

-- 3. Tables
INSERT INTO Restaurant.RestaurantTables (TableNumber, Capacity) VALUES 
('T01', 2), 
('T02', 4), 
('T03', 6), 
('T04', 2),
('T05', 8);

-- 4. Customers
INSERT INTO Restaurant.Customers (FirstName, LastName, Phone, Email) VALUES 
('Alice', 'Brown', '555-1234', 'alice@email.com'),
('Bob', 'Davis', '555-5678', 'bob@email.com'),
('Carol', 'Miller', '555-9012', 'carol@email.com'),
('David', 'Wilson', '555-3456', 'david@email.com');

-- 5. Menu Items (after Categories)
INSERT INTO Restaurant.MenuItems (ItemName, CategoryID, Price, Description) VALUES 
('Caesar Salad', 1, 12.99, 'Fresh romaine with caesar dressing'),
('Buffalo Wings', 1, 14.99, 'Spicy chicken wings'),
('Grilled Chicken', 2, 18.99, 'Herb-seasoned grilled chicken breast'),
('Beef Burger', 2, 16.99, 'Juicy beef patty with fixings'),
('Fish Tacos', 2, 15.99, 'Fresh fish with cilantro lime sauce'),
('Chocolate Cake', 3, 8.99, 'Rich chocolate layer cake'),
('Cheesecake', 3, 7.99, 'New York style cheesecake'),
('Coffee', 4, 3.99, 'Fresh brewed coffee'),
('Iced Tea', 4, 2.99, 'Sweet or unsweetened');

-- 6. Orders (after Customers, Tables, Staff)
INSERT INTO Restaurant.Orders (CustomerID, TableID, ServerID, OrderStatus, TotalAmount) VALUES 
(1, 1, 1, 'Completed', 29.98),
(2, 2, 1, 'Preparing', 29.98),
(3, 3, 2, 'Pending', 18.99),
(4, 4, 2, 'Completed', 45.97);

-- 7. Order Items (LAST - after Orders and MenuItems)
INSERT INTO Restaurant.OrderItems (OrderID, ItemID, Quantity, UnitPrice, LineTotal) VALUES 
(1, 1, 1, 12.99, 12.99),  -- Order 1: Caesar Salad
(1, 4, 1, 16.99, 16.99),  -- Order 1: Beef Burger
(2, 2, 2, 14.99, 29.98),  -- Order 2: 2x Buffalo Wings
(3, 3, 1, 18.99, 18.99),  -- Order 3: Grilled Chicken
(4, 5, 1, 15.99, 15.99),  -- Order 4: Fish Tacos
(4, 6, 1, 8.99, 8.99),    -- Order 4: Chocolate Cake
(4, 8, 3, 3.99, 11.97),   -- Order 4: 3x Coffee
(4, 7, 1, 7.99, 7.99);    -- Order 4: Cheesecake

-- =====================================================
-- SIMPLE VIEW
-- =====================================================
CREATE VIEW Restaurant.MenuView AS
SELECT 
    c.CategoryName,
    m.ItemName,
    m.Price,
    m.Description,
    m.IsAvailable
FROM Restaurant.MenuItems m
JOIN Restaurant.Categories c ON m.CategoryID = c.CategoryID
WHERE m.IsAvailable = 1;
GO

