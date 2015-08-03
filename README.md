# dynamodb-copyregion
Command to copy all tables from one region to another

# Use as CLI
```
› npm install -g dynamodb-copyregion
```
```
› dynamodb-copyregion --help

Command: dynamodb-copyregion
Description: Attempts to copy all table schemas from one region to another. Copies schema (not data) and not if table with source name already exists at destination.

Arguments: --sourceregion (required): Source region containing dynamo db tables to read (e.g. "us-west-1")
           --destinationregion (required): Destination region to create tables (e.g. "us-west-2")
           --tablename (options): Specific table name to copy. If ommitted, all tables will be copied
           --awsprofilename (optional): AWS credential profile name to use. Omit to use default, or set the evironment var AWS_PROFILE
```

# Use in node

## Copying all tables
```
› npm install --save dynamodb-copyregion
```
```
var dynamodbcopyregion = require('dynamodb-copyregion');
var dynamoDbCopier = dynamodbcopyregion('us-west-1', 'eu-west-1', 'myaws-work-profile'); //third argument, aws credential service name, is optional
dynamoDbCopier.CopyTables()
.then(function(result) {

  console.log('Tables which already existed:');
  result.TablesAlreadyExisted.forEach(function(tableName){
    console.log('  - ' + tableName);
  });
  console.log('Tables successfully copied:');
  result.TablesCopied.forEach(function(tableName){
    console.log('  - ' + tableName);
  });
});
```

## Copying a single table
```
› npm install --save dynamodb-copyregion
```
```
var dynamodbcopyregion = require('dynamodb-copyregion');
var dynamoDbCopier = dynamodbcopyregion('us-west-1', 'eu-west-1', 'myaws-work-profile'); //third argument, aws credential service name, is optional
dynamoDbCopier.CopyTable('myTableName')
.then(function(result) {

  if (result.AlreadyExists) {
    console.log('Table with name ' + argv.tablename + ' already exists in destination.');
  }
  if (result.Success === true) {
    console.log('Table successfully copied');
  }
})
.catch(function(err){

  console.error(err);
});
```
