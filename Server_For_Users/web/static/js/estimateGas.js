contractABI = JSON.parse(window.localStorage.TransferOwnership_ContractABI);

contractAddress = window.localStorage.TransferOwnership_ContractAddress;

contract = new window.web3.eth.Contract(contractABI, contractAddress);

accountUsedToLogin = window.localStorage["userAddress"];



// set the account that will send the transaction
account = '0xC43a2128D48798459F421552F664571c6104941f';


// set the transaction data
txData = contract.methods.transferOwnerShip(3).encodeABI();


priceOffered = web3.utils.toWei(String(5));



// estimate the gas required for the transaction
web3.eth.estimateGas({
    from: account,
    to: contractAddress,
    data: txData,
    value: priceOffered,
    overrides: {
      deadlineForPayment: Math.floor(Date.now() / 1000) + 3600 // set deadline to one hour from now
    }
  })
  .then((gas) => {
    // pass the estimated gas with the send function
    console.log(gas);
  })
  .catch((error) => {
    console.error('Error estimating gas:', error);
  });