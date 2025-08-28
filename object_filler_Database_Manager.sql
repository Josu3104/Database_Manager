-
- Comprehensive SQL Script to Test All Database Objects
-- This script creates various database objects to test the tree view display

-- =====================================================
-- 1. TABLES
-- =====================================================

-- Create test tables
CREATE TABLE dbo.Employees (
    EmployeeID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) UNIQUE,
    HireDate DATE DEFAULT GETDATE(),
    Salary DECIMAL(10,2),
    DepartmentID INT
);

CREATE TABLE dbo.Departments (
    DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentName NVARCHAR(100) NOT NULL,
    Location NVARCHAR(100),
    Budget DECIMAL(12,2)
);

CREATE TABLE dbo.Projects (
    ProjectID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectName NVARCHAR(100) NOT NULL,
    StartDate DATE,
    EndDate DATE,
    Budget DECIMAL(12,2),
    Status NVARCHAR(20) DEFAULT 'Active'
);

-- Create a custom schema and table
CREATE SCHEMA HR;
GO

CREATE TABLE HR.Payroll (
    PayrollID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT,
    PayDate DATE,
    GrossPay DECIMAL(10,2),
    NetPay DECIMAL(10,2),
    TaxAmount DECIMAL(10,2)
);

-- =====================================================
-- 2. VIEWS
-- =====================================================

-- Create views
CREATE VIEW dbo.EmployeeDetails AS
SELECT 
    e.EmployeeID,
    e.FirstName + ' ' + e.LastName AS FullName,
    e.Email,
    e.HireDate,
    e.Salary,
    d.DepartmentName
FROM dbo.Employees e
LEFT JOIN dbo.Departments d ON e.DepartmentID = d.DepartmentID;

CREATE VIEW dbo.DepartmentSummary AS
SELECT 
    d.DepartmentID,
    d.DepartmentName,
    COUNT(e.EmployeeID) AS EmployeeCount,
    AVG(e.Salary) AS AvgSalary,
    SUM(e.Salary) AS TotalSalary
FROM dbo.Departments d
LEFT JOIN dbo.Employees e ON d.DepartmentID = e.DepartmentID
GROUP BY d.DepartmentID, d.DepartmentName;

CREATE VIEW HR.SalaryReport AS
SELECT 
    p.PayrollID,
    e.FirstName + ' ' + e.LastName AS EmployeeName,
    p.PayDate,
    p.GrossPay,
    p.NetPay,
    p.TaxAmount
FROM HR.Payroll p
JOIN dbo.Employees e ON p.EmployeeID = e.EmployeeID;

-- =====================================================
-- 3. STORED PROCEDURES
-- =====================================================

-- Create stored procedures
CREATE PROCEDURE dbo.GetEmployeesByDepartment
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
    FROM dbo.Employees e
    LEFT JOIN dbo.Departments d ON e.DepartmentID = d.DepartmentID
    WHERE (@DepartmentID IS NULL OR e.DepartmentID = @DepartmentID)
    ORDER BY e.LastName, e.FirstName;
END;
GO

CREATE PROCEDURE dbo.InsertEmployee
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @Email NVARCHAR(100),
    @DepartmentID INT = NULL,
    @Salary DECIMAL(10,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO dbo.Employees (FirstName, LastName, Email, DepartmentID, Salary)
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
    
    DECLARE @GrossPay DECIMAL(10,2) = (SELECT Salary FROM dbo.Employees WHERE EmployeeID = @EmployeeID);
    DECLARE @TaxRate DECIMAL(5,4) = 0.15;
    DECLARE @TaxAmount DECIMAL(10,2) = @GrossPay * @TaxRate;
    DECLARE @NetPay DECIMAL(10,2) = @GrossPay - @TaxAmount;
    
    INSERT INTO HR.Payroll (EmployeeID, PayDate, GrossPay, NetPay, TaxAmount)
    VALUES (@EmployeeID, @PayDate, @GrossPay, @NetPay, @TaxAmount);
    
    SELECT SCOPE_IDENTITY() AS PayrollID;
END;
GO

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

-- Create functions
CREATE FUNCTION dbo.GetEmployeeFullName
(
    @EmployeeID INT
)
RETURNS NVARCHAR(101)
AS
BEGIN
    DECLARE @FullName NVARCHAR(101);
    
    SELECT @FullName = FirstName + ' ' + LastName
    FROM dbo.Employees
    WHERE EmployeeID = @EmployeeID;
    
    RETURN @FullName;
END;
GO

CREATE FUNCTION dbo.CalculateYearsOfService
(
    @HireDate DATE
)
RETURNS INT
AS
BEGIN
    RETURN DATEDIFF(YEAR, @HireDate, GETDATE());
END;
GO

CREATE FUNCTION dbo.GetDepartmentEmployees
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
    FROM dbo.Employees
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
-- 5. SEQUENCES
-- =====================================================

-- Create sequences
CREATE SEQUENCE dbo.OrderNumberSequence
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
-- 6. TRIGGERS
-- =====================================================

-- Create triggers
CREATE TRIGGER dbo.trg_Employees_Update
ON dbo.Employees
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF UPDATE(Salary)
    BEGIN
        INSERT INTO dbo.SalaryHistory (EmployeeID, OldSalary, NewSalary, ChangeDate)
        SELECT 
            i.EmployeeID,
            d.Salary,
            i.Salary,
            GETDATE()
        FROM inserted i
        INNER JOIN deleted d ON i.EmployeeID = d.EmployeeID
        WHERE i.Salary != d.Salary;
    END;
END;
GO

-- Create table for trigger to work
CREATE TABLE dbo.SalaryHistory (
    HistoryID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT,
    OldSalary DECIMAL(10,2),
    NewSalary DECIMAL(10,2),
    ChangeDate DATETIME
);

CREATE TRIGGER dbo.trg_Departments_Delete
ON dbo.Departments
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM deleted d INNER JOIN dbo.Employees e ON d.DepartmentID = e.DepartmentID)
    BEGIN
        RAISERROR ('Cannot delete department with employees', 16, 1);
        RETURN;
    END;
    
    DELETE FROM dbo.Departments 
    WHERE DepartmentID IN (SELECT DepartmentID FROM deleted);
END;
GO

-- =====================================================
-- 7. INDEXES
-- =====================================================

-- Create indexes
CREATE NONCLUSTERED INDEX IX_Employees_LastName_FirstName
ON dbo.Employees (LastName, FirstName);

CREATE NONCLUSTERED INDEX IX_Employees_Email
ON dbo.Employees (Email);

CREATE NONCLUSTERED INDEX IX_Employees_DepartmentID
ON dbo.Employees (DepartmentID);

CREATE NONCLUSTERED INDEX IX_Employees_HireDate
ON dbo.Employees (HireDate);

CREATE NONCLUSTERED INDEX IX_Payroll_EmployeeID_PayDate
ON HR.Payroll (EmployeeID, PayDate);

CREATE UNIQUE NONCLUSTERED INDEX IX_Departments_DepartmentName
ON dbo.Departments (DepartmentName);

-- =====================================================
-- 8. INSERT SAMPLE DATA
-- =====================================================

-- Insert sample data
INSERT INTO dbo.Departments (DepartmentName, Location, Budget) VALUES
('IT', 'Building A', 500000.00),
('HR', 'Building B', 300000.00),
('Finance', 'Building C', 400000.00),
('Marketing', 'Building D', 350000.00);

INSERT INTO dbo.Employees (FirstName, LastName, Email, DepartmentID, Salary) VALUES
('John', 'Doe', 'john.doe@company.com', 1, 75000.00),
('Jane', 'Smith', 'jane.smith@company.com', 2, 65000.00),
('Bob', 'Johnson', 'bob.johnson@company.com', 1, 80000.00),
('Alice', 'Brown', 'alice.brown@company.com', 3, 70000.00),
('Charlie', 'Wilson', 'charlie.wilson@company.com', 4, 60000.00);

INSERT INTO dbo.Projects (ProjectName, StartDate, EndDate, Budget, Status) VALUES
('Website Redesign', '2024-01-01', '2024-06-30', 100000.00, 'Active'),
('Database Migration', '2024-03-01', '2024-08-31', 150000.00, 'Active'),
('Mobile App Development', '2024-02-01', '2024-12-31', 200000.00, 'Planning');

-- =====================================================
-- 9. TEST THE OBJECTS
-- =====================================================

-- Test stored procedures
EXEC dbo.GetEmployeesByDepartment @DepartmentID = 1;
EXEC dbo.InsertEmployee @FirstName = 'Test', @LastName = 'User', @Email = 'test@company.com', @DepartmentID = 1, @Salary = 55000.00;

-- Test functions
SELECT dbo.GetEmployeeFullName(1) AS EmployeeName;
SELECT dbo.CalculateYearsOfService('2020-01-15') AS YearsOfService;
SELECT * FROM dbo.GetDepartmentEmployees(1);
SELECT HR.GetTotalPayroll('2024-01-01', '2024-12-31') AS TotalPayroll;

-- Test sequences
SELECT NEXT VALUE FOR dbo.OrderNumberSequence AS NextOrderNumber;
SELECT NEXT VALUE FOR HR.BadgeNumberSequence AS NextBadgeNumber;

-- Test views
SELECT * FROM dbo.EmployeeDetails;
SELECT * FROM dbo.DepartmentSummary;
SELECT * FROM HR.SalaryReport;

-- Test triggers by updating salary
UPDATE dbo.Employees SET Salary = 80000.00 WHERE EmployeeID = 1;
SELECT * FROM dbo.SalaryHistory;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Verify all objects were created
SELECT 'Tables' AS ObjectType, COUNT(*) AS Count FROM sys.tables WHERE type = 'U'
UNION ALL
SELECT 'Views', COUNT(*) FROM sys.views
UNION ALL
SELECT 'Stored Procedures', COUNT(*) FROM sys.procedures
UNION ALL
SELECT 'Functions', COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF','AF','FS','FT')
UNION ALL
SELECT 'Sequences', COUNT(*) FROM sys.sequences
UNION ALL
SELECT 'Triggers', COUNT(*) FROM sys.triggers
UNION ALL
SELECT 'Indexes', COUNT(*) FROM sys.indexes WHERE index_id > 0
UNION ALL
SELECT 'Filegroups', COUNT(*) FROM sys.filegroups
UNION ALL
SELECT 'Users', COUNT(*) FROM sys.database_principals WHERE type IN ('S','U','G') AND name NOT IN ('dbo','guest','INFORMATION_SCHEMA','sys');

PRINT 'Database objects test script completed successfully!';
PRINT 'All objects should now be visible in the tree view.';
