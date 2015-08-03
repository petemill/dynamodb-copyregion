#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var dynamodbcopyregion = require('../index.js');

function ShowCommandOptions() {

  console.log();
  console.log('Command: dynamodb-copyregion');
  console.log('Description: Attempts to copy all table schemas from one region to another. Copies schema (not data) and not if table with source name already exists at destination.');
  console.log();
  console.log('Arguments: --sourceregion (required): Source region containing dynamo db tables to read (e.g. "us-west-1")');
  console.log('           --destinationregion (required): Destination region to create tables (e.g. "us-west-2")');
  console.log('           --tablename (options): Specific table name to copy. If ommitted, all tables will be copied');
  console.log('           --awsprofilename (optional): AWS credential profile name to use. Omit to use default, or set the evironment var AWS_PROFILE');
}

var sourceRegion;
var destinationRegion;

var valid = true;

if (argv.help) {
  return ShowCommandOptions();
}

if (argv.sourceregion) {
  sourceRegion = argv.sourceregion;
}

if (argv.destinationregion)
  destinationRegion = argv.destinationregion;

if (!sourceRegion) {
  valid = false;
  console.log('Error: source region not specified.');
}

if (!destinationRegion) {
  valid = false;
  console.log('Error: destination region not specified.');
}

if (!valid) {
  return ShowCommandOptions();
}

var copier = dynamodbcopyregion(sourceRegion, destinationRegion, argv.awsprofilename);


if (argv.tablename) {
  copier.CopyTable(argv.tablename)
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
}
else {
  copier.CopyTables()
  .then(function(result){

    console.log('Tables which already existed:');
    result.TablesAlreadyExisted.forEach(function(tableName){
      console.log('  - ' + tableName);
    });
    console.log('Tables successfully copied:');
    result.TablesCopied.forEach(function(tableName){
      console.log('  - ' + tableName);
    });
  })
  .catch(function(err){

    console.error(err);
  });
}
