

const DDL ={  
createDatabase: async (connectionMetadata, dbName) => {
    try {
        const pool = connectionMetadata.pool || connectionMetadata;
        
        if (!pool) {
            return { success: false, message: 'Invalid connection pool' };
        }
        
        await pool.request().query(`CREATE DATABASE [${dbName}];`);
        return { success: true, message: `Database ${dbName} created successfully.` };
    } catch (error) {
        return { success: false, message: error.message };
    }
}
,



// Execute SQL query
executeSql: async (connectionMetadata, sqlText) => {
    try{
        const pool = connectionMetadata.pool || connectionMetadata;
        if(!pool){
            return { success:false, message:'Invalid connection pool' };
        }
        const result = await pool.request().query(sqlText);
        return { success:true, rows: result.recordset, rowsAffected: result.rowsAffected };
    }catch(error){
        return { success:false, message:error.message };
    }
}
}

export default DDL;