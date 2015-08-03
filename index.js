var AWS = require('aws-sdk');

function GetTableNames(ddb) {

  return new Promise(function(resolve, reject) {

    ddb.listTables({}, function(err, data) {

      if (err) return reject(err);
      resolve(data.TableNames);
    });
  });
}

function CopyTable(sourceTableName, ddbSource, ddbDestination, inDestinationTableNames) {

  var opDestinationTables = !inDestinationTableNames ? GetTableNames(ddbDestination) : Promise.resolve(inDestinationTableNames);
  return opDestinationTables
  .then(function(destinationTableNames){

    if (destinationTableNames.indexOf(sourceTableName) !== -1) {
      return Promise.resolve({AlreadyExists: true});
    }
    return new Promise(function(resolve, reject) {

      //get table Data
      ddbSource.describeTable({TableName: sourceTableName}, function(dterr, dtdata) {

        if (dterr) return reject(dterr);
        var sourceTableData = dtdata.Table;
        var params = {
          TableName: sourceTableName,
          AttributeDefinitions: sourceTableData.AttributeDefinitions,
          KeySchema: sourceTableData.KeySchema,
          ProvisionedThroughput: {
            ReadCapacityUnits: sourceTableData.ProvisionedThroughput.ReadCapacityUnits,
            WriteCapacityUnits: sourceTableData.ProvisionedThroughput.WriteCapacityUnits
          }
        };
        if (sourceTableData.GlobalSecondaryIndexes) {
          params.GlobalSecondaryIndexes = sourceTableData.GlobalSecondaryIndexes.map(function(sourceIndex) {
            return {
              IndexName: sourceIndex.IndexName,
              KeySchema: sourceIndex.KeySchema,
              Projection: sourceIndex.Projection,
              ProvisionedThroughput: {
                ReadCapacityUnits: sourceIndex.ProvisionedThroughput.ReadCapacityUnits,
                WriteCapacityUnits: sourceIndex.ProvisionedThroughput.WriteCapacityUnits
              }
            };
          });
        }
        if (sourceTableData.LocalSecondaryIndexes) {
          params.LocalSecondaryIndexes = sourceTableData.LocalSecondaryIndexes.map(function(sourceIndex) {
            return {
              IndexName: sourceIndex.IndexName,
              KeySchema: sourceIndex.KeySchema,
              Projection: sourceIndex.Projection
            };
          });
        }
        ddbDestination.createTable(params, function(cterr, ctdata) {

          if (cterr) return reject(cterr);
          resolve({AlreadyExists: false, Success: true});
        });
      });
    });
  });
}


function CopyTables(ddbSource, ddbDestination) {

  return Promise.all([GetTableNames(ddbDestination), GetTableNames(ddbSource)])
  .then(function(getTableResults) {
    var destinationTableNames = getTableResults[0];
    var sourceTableNames = getTableResults[1];
    var tablesExisted = [];
    var tablesCopied = [];
    var allOps = sourceTableNames.map(function(sourceTableName) {

      return CopyTable(sourceTableName, ddbSource, ddbDestination, destinationTableNames)
      .then(function(copyTableResult){
        if (copyTableResult.AlreadyExists === true) {
          tablesExisted.push(sourceTableName);
        }
        if (copyTableResult.Success === true) {
          tablesCopied.push(sourceTableName);
        }
        return Promise.resolve();
      });
    });
    //when all table results are back, return
    return Promise.all(allOps)
    .then(function(){
      return Promise.resolve({
        TablesAlreadyExisted: tablesExisted,
        TablesCopied: tablesCopied
      });
    });
  });
}

module.exports = function (sourceRegionName, destinationRegionName, awsProfileName) {

  //validate
  if (!sourceRegionName) {
    throw new Error('sourceRegionName must be valid');
  }
  if (!destinationRegionName) {
    throw new Error('destinationRegionName must be valid');
  }
  if (awsProfileName)
    AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: awsProfileName});
  //create dynamodb objects for each region
  var ddbSource = new AWS.DynamoDB({region: sourceRegionName});
  var ddbDestination = new AWS.DynamoDB({region: destinationRegionName});
  //expose CopyTable and CopyTables to caller
  return {
    CopyTable: function(tableName) {
      return CopyTable(tableName, ddbSource, ddbDestination);
    },
    CopyTables: function() {
      return CopyTables(ddbSource, ddbDestination);
    }
  };
};
