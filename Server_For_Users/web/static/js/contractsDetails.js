



var xhr = new XMLHttpRequest();

xhr.open('GET', '/fetchContractDetails', true);

xhr.onload = function () {
  if (xhr.status === 200) {

    window.response = JSON.parse(xhr.responseText);


    // Users Contract
    window.localStorage.Users_ContractAddress = response["Users"]["address"];
    window.localStorage.Users_ContractABI = JSON.stringify(response["Users"]["abi"]);

    // LandRegistry
    window.localStorage.LandRegistry_ContractAddress = response["LandRegistry"]["address"];
    window.localStorage.LandRegistry_ContractABI = JSON.stringify(response["LandRegistry"]["abi"]);

    // TransferOwnership
    window.localStorage.TransferOwnership_ContractAddress = response["TransferOwnership"]["address"];
    window.localStorage.TransferOwnership_ContractABI = JSON.stringify(response["TransferOwnership"]["abi"]);


  } else {
    console.log('Request failed.  Returned status of ' + xhr.status);
  }
};

xhr.send();








async function logout() {


  const provider = window.ethereum;

  // Check if the provider is available
  if (provider) {
    try {
      await provider.disconnect();
      console.log("Disconnected from provider.");
    } catch (err) {
      console.error(err);
    }
  }
  else {
    console.log("Provider not available.");
  }


}