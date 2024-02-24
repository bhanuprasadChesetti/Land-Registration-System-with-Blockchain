
// Users contract : for holding user data and methods
var Users = artifacts.require("Users");  // contract Name


// // Property contract : for holding property and methods
// var Properties = artifacts.require("Property");  


// LandRegistry : holds owner-land mapping and ownership transfer
var LandRegistry = artifacts.require("LandRegistry");




// TransferOwnerShip : holds  ownership transfer and sales
var transferOfOwnership = artifacts.require("TransferOwnerShip");



module.exports = async function(deployer) {
  // deployment steps

  await deployer.deploy(Users);

  // deployer.deploy(Properties);

  await deployer.deploy(LandRegistry);

  await deployer.deploy(transferOfOwnership,LandRegistry.address);
};

