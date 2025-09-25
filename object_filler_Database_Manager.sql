-- Comprehensive SQL Script to Test All Database Objects (NO DBO SCHEMA)
-- This script creates various database objects without using dbo schema

-- =====================================================
-- 1. CREATE SCHEMAS
-- =====================================================

-- Create custom schemas
CREATE SCHEMA Company;
GO

CREATE SCHEMA HR;
GO

CREATE SCHEMA Finance;
GO

-- =====================================================
-- 2. TABLES
-- =====================================================

-- Create test tables in Company schema
CREATE TABLE Company.Employees (
    EmployeeID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) UNIQUE,
    HireDate DATE DEFAULT GETDATE(),
    Salary DECIMAL(10,2),
    DepartmentID INT
);

CREATE TABLE Company.Departments (
    DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentName NVARCHAR(100) NOT NULL,
    Location NVARCHAR(100),
    Budget DECIMAL(12,2)
);

CREATE TABLE Company.Projects (
    ProjectID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectName NVARCHAR(100) NOT NULL,
    StartDate DATE,
    EndDate DATE,
    Budget DECIMAL(12,2),
    Status NVARCHAR(20) DEFAULT 'Active'
);

-- Create tables in HR schema
CREATE TABLE HR.Payroll (
    PayrollID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT,
    PayDate DATE,
    GrossPay DECIMAL(10,2),
    NetPay DECIMAL(10,2),
    TaxAmount DECIMAL(10,2)
);

CREATE TABLE HR.Benefits (
    BenefitID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT,
    BenefitType NVARCHAR(50),
    BenefitValue DECIMAL(10,2),
    StartDate DATE,
    EndDate DATE
);

-- Create table in Finance schema
CREATE TABLE Finance.Expenses (
    ExpenseID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT,
    ExpenseType NVARCHAR(50),
    Amount DECIMAL(10,2),
    ExpenseDate DATE,
    Description NVARCHAR(200)
);

-- =====================================================
-- 3. VIEWS
-- =====================================================

-- Create views
CREATE VIEW Company.EmployeeDetails AS
SELECT 
    e.EmployeeID,
    e.FirstName + ' ' + e.LastName AS FullName,
    e.Email,
    e.HireDate,
    e.Salary,
    d.DepartmentName
FROM Company.Employees e
LEFT JOIN Company.Departments d ON e.DepartmentID = d.DepartmentID;
GO

CREATE VIEW Company.DepartmentSummary AS
SELECT 
    d.DepartmentID,
    d.DepartmentName,
    COUNT(e.EmployeeID) AS EmployeeCount,
    AVG(e.Salary) AS AvgSalary,
    SUM(e.Salary) AS TotalSalary
FROM Company.Departments d
LEFT JOIN Company.Employees e ON d.DepartmentID = e.DepartmentID
GROUP BY d.DepartmentID, d.DepartmentName;
GO

CREATE VIEW HR.SalaryReport AS
SELECT 
    p.PayrollID,
    e.FirstName + ' ' + e.LastName AS EmployeeName,
    p.PayDate,
    p.GrossPay,
    p.NetPay,
    p.TaxAmount
FROM HR.Payroll p
JOIN Company.Employees e ON p.EmployeeID = e.EmployeeID;
GO

-- =====================================================
-- 4. STORED PROCEDURES
-- =====================================================

-- Create stored procedures
CREATE PROCEDURE Company.GetEmployeesByDepartment
    @DepartmentID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        e.EmployeeID,
        e.FirstName,
        e.LastName,
        e.Email,
        e.HireDate,
        e.Salary,
        d.DepartmentName
    FROM Company.Employees e
    LEFT JOIN Company.Departments d ON e.DepartmentID = d.DepartmentID
    WHERE (@DepartmentID IS NULL OR e.DepartmentID = @DepartmentID)
    ORDER BY e.LastName, e.FirstName;
END;
GO

CREATE PROCEDURE Company.InsertEmployee
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @Email NVARCHAR(100),
    @DepartmentID INT = NULL,
    @Salary DECIMAL(10,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Company.Employees (FirstName, LastName, Email, DepartmentID, Salary)
    VALUES (@FirstName, @LastName, @Email, @DepartmentID, @Salary);
    
    SELECT SCOPE_IDENTITY() AS NewEmployeeID;
END;
GO

CREATE PROCEDURE HR.CalculatePayroll
    @EmployeeID INT,
    @PayDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @GrossPay DECIMAL(10,2) = (SELECT Salary FROM Company.Employees WHERE EmployeeID = @EmployeeID);
    DECLARE @TaxRate DECIMAL(5,4) = 0.15;
    DECLARE @TaxAmount DECIMAL(10,2) = @GrossPay * @TaxRate;
    DECLARE @NetPay DECIMAL(10,2) = @GrossPay - @TaxAmount;
    
    INSERT INTO HR.Payroll (EmployeeID, PayDate, GrossPay, NetPay, TaxAmount)
    VALUES (@EmployeeID, @PayDate, @GrossPay, @NetPay, @TaxAmount);
    
    SELECT SCOPE_IDENTITY() AS PayrollID;
END;
GO

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Create functions
CREATE FUNCTION Company.GetEmployeeFullName
(
    @EmployeeID INT
)
RETURNS NVARCHAR(101)
AS
BEGIN
    DECLARE @FullName NVARCHAR(101);
    
    SELECT @FullName = FirstName + ' ' + LastName
    FROM Company.Employees
    WHERE EmployeeID = @EmployeeID;
    
    RETURN @FullName;
END;
GO

CREATE FUNCTION Company.CalculateYearsOfService
(
    @HireDate DATE
)
RETURNS INT
AS
BEGIN
    RETURN DATEDIFF(YEAR, @HireDate, GETDATE());
END;
GO

CREATE FUNCTION Company.GetDepartmentEmployees
(
    @DepartmentID INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        EmployeeID,
        FirstName,
        LastName,
        Email,
        HireDate,
        Salary
    FROM Company.Employees
    WHERE DepartmentID = @DepartmentID
);
GO

CREATE FUNCTION HR.GetTotalPayroll
(
    @StartDate DATE,
    @EndDate DATE
)
RETURNS DECIMAL(12,2)
AS
BEGIN
    DECLARE @Total DECIMAL(12,2);
    
    SELECT @Total = SUM(GrossPay)
    FROM HR.Payroll
    WHERE PayDate BETWEEN @StartDate AND @EndDate;
    
    RETURN ISNULL(@Total, 0);
END;
GO

-- =====================================================
-- 6. SEQUENCES
-- =====================================================

-- Create sequences
CREATE SEQUENCE Company.OrderNumberSequence
    AS INT
    START WITH 1000
    INCREMENT BY 1
    MINVALUE 1000
    MAXVALUE 999999
    CYCLE;
GO

CREATE SEQUENCE HR.BadgeNumberSequence
    AS INT
    START WITH 10000
    INCREMENT BY 10
    MINVALUE 10000
    MAXVALUE 99999;
GO

-- =====================================================
-- 7. INDEXES
-- =====================================================

-- Create indexes
CREATE NONCLUSTERED INDEX IX_Employees_LastName_FirstName
ON Company.Employees (LastName, FirstName);

CREATE NONCLUSTERED INDEX IX_Employees_Email
ON Company.Employees (Email);

CREATE NONCLUSTERED INDEX IX_Employees_DepartmentID
ON Company.Employees (DepartmentID);

CREATE NONCLUSTERED INDEX IX_Employees_HireDate
ON Company.Employees (HireDate);

CREATE NONCLUSTERED INDEX IX_Payroll_EmployeeID_PayDate
ON HR.Payroll (EmployeeID, PayDate);

CREATE UNIQUE NONCLUSTERED INDEX IX_Departments_DepartmentName
ON Company.Departments (DepartmentName);

-- =====================================================
-- 8. INSERT SAMPLE DATA
-- =====================================================

-- Insert sample data
INSERT INTO Company.Departments (DepartmentName, Location, Budget) VALUES
('IT', 'Building A', 500000.00),
('HR', 'Building B', 300000.00),
('Finance', 'Building C', 400000.00),
('Marketing', 'Building D', 350000.00);

INSERT INTO Company.Employees (FirstName, LastName, Email, DepartmentID, Salary) VALUES
('John', 'Doe', 'john.doe@company.com', 1, 75000.00),
('Jane', 'Smith', 'jane.smith@company.com', 2, 65000.00),
('Bob', 'Johnson', 'bob.johnson@company.com', 1, 80000.00),
('Alice', 'Brown', 'alice.brown@company.com', 3, 70000.00),
('Charlie', 'Wilson', 'charlie.wilson@company.com', 4, 60000.00),
('Diana', 'Davis', 'diana.davis@company.com', 2, 68000.00);

INSERT INTO Company.Projects (ProjectName, StartDate, EndDate, Budget, Status) VALUES
('Website Redesign', '2024-01-01', '2024-06-30', 100000.00, 'Active'),
('Database Migration', '2024-03-01', '2024-08-31', 150000.00, 'Active'),
('Mobile App Development', '2024-02-01', '2024-12-31', 200000.00, 'Planning'),
('Cloud Infrastructure', '2024-04-01', '2024-10-31', 180000.00, 'Active');

INSERT INTO HR.Benefits (EmployeeID, BenefitType, BenefitValue, StartDate) VALUES
(1, 'Health Insurance', 500.00, '2024-01-01'),
(2, 'Dental Insurance', 150.00, '2024-01-01'),
(3, 'Vision Insurance', 100.00, '2024-01-01'),
(4, 'Health Insurance', 500.00, '2024-01-01'),
(5, 'Health Insurance', 500.00, '2024-01-01');

INSERT INTO Finance.Expenses (EmployeeID, ExpenseType, Amount, ExpenseDate, Description) VALUES
(1, 'Travel', 1200.00, '2024-01-15', 'Conference attendance'),
(2, 'Office Supplies', 150.00, '2024-01-20', 'Desk accessories'),
(3, 'Software License', 299.00, '2024-02-01', 'Development tools'),
(4, 'Training', 800.00, '2024-02-10', 'Professional certification');

-- =====================================================
-- 9. TEST THE OBJECTS
-- =====================================================

-- Test stored procedures
EXEC Company.GetEmployeesByDepartment @DepartmentID = 1;
EXEC Company.InsertEmployee @FirstName = 'Test', @LastName = 'User', @Email = 'test@company.com', @DepartmentID = 1, @Salary = 55000.00;

-- Test functions
SELECT Company.GetEmployeeFullName(1) AS EmployeeName;
SELECT Company.CalculateYearsOfService('2020-01-15') AS YearsOfService;
SELECT * FROM Company.GetDepartmentEmployees(1);
SELECT HR.GetTotalPayroll('2024-01-01', '2024-12-31') AS TotalPayroll;

-- Test sequences
SELECT NEXT VALUE FOR Company.OrderNumberSequence AS NextOrderNumber;
SELECT NEXT VALUE FOR HR.BadgeNumberSequence AS NextBadgeNumber;

-- Test views
SELECT * FROM Company.EmployeeDetails;
SELECT * FROM Company.DepartmentSummary;
SELECT * FROM HR.SalaryReport;

-- Add some payroll data to test
EXEC HR.CalculatePayroll @EmployeeID = 1, @PayDate = '2024-01-31';
EXEC HR.CalculatePayroll @EmployeeID = 2, @PayDate = '2024-01-31';
EXEC HR.CalculatePayroll @EmployeeID = 3, @PayDate = '2024-01-31';

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Verify all objects were created
SELECT 'Tables' AS ObjectType, COUNT(*) AS Count FROM sys.tables WHERE type = 'U' AND SCHEMA_NAME(schema_id) != 'dbo'
UNION ALL
SELECT 'Views', COUNT(*) FROM sys.views WHERE SCHEMA_NAME(schema_id) != 'dbo'
UNION ALL
SELECT 'Stored Procedures', COUNT(*) FROM sys.procedures WHERE SCHEMA_NAME(schema_id) != 'dbo'
UNION ALL
SELECT 'Functions', COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF','AF','FS','FT') AND SCHEMA_NAME(schema_id) != 'dbo'
UNION ALL
SELECT 'Sequences', COUNT(*) FROM sys.sequences WHERE SCHEMA_NAME(schema_id) != 'dbo'
UNION ALL
SELECT 'Schemas', COUNT(*) FROM sys.schemas WHERE name NOT IN ('dbo', 'sys', 'INFORMATION_SCHEMA', 'guest');

-- Show schema distribution
SELECT 
    SCHEMA_NAME(schema_id) AS SchemaName,
    COUNT(*) AS TableCount
FROM sys.tables 
WHERE type = 'U' AND SCHEMA_NAME(schema_id) != 'dbo'
GROUP BY SCHEMA_NAME(schema_id)
ORDER BY SchemaName;

PRINT 'Database objects test script completed successfully (NO DBO)!';
PRINT 'All objects should now be visible in the tree view without dbo schema.';
