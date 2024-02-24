


async function checkConnection()
{
    
  // checking Meta-Mask extension is added or not
  if (window.ethereum){

    try{
    //   await ethereum.enable();

      window.web3  = new Web3(ethereum);

      const accounts = await web3.eth.getAccounts();

      const accountConnectedToMetaMask = accounts[0];

      console.log("Account Connected to MetaMask:", accountConnectedToMetaMask);
      console.log("Account used to login        :",window.localStorage["employeeId"])
      console.log(accountConnectedToMetaMask != window.localStorage["employeeId"]);

      if( accountConnectedToMetaMask != window.localStorage["employeeId"])
      {
        alert("Mismatch in account used to login and connected to metamask.. Please login again");
        window.location.href = "/";
      }
      else
      {
        console.log("No Account changes detected !!");

        // fetch user details
        //fetchUserDetails();


        console.log("Revenue Dept ID:"+window.localStorage.revenueDepartmentId);

        document.getElementById("revenueDeptId").innerText = window.localStorage.revenueDepartmentId;

        document.getElementById('nameOfUser').innerText = window.localStorage.empName;

        // fetch properties 
        fetchPropertiesUnderControl(window.localStorage.revenueDepartmentId);

      }

    }catch(error){

      alert(error);

    }

  }else{
    alert("Please Add Metamask extension for your browser !!");
  }

}



async function fetchPropertiesUnderControl(revenueDepartmentId)
{

    let contractABI = JSON.parse(window.localStorage.LandRegistry_ContractABI);

    let contractAddress = window.localStorage.LandRegistry_ContractAddress;
  
    let contract = new window.web3.eth.Contract(contractABI,contractAddress);
  
    let accountUsedToLogin = window.localStorage["employeeId"];
  
    try{
  
      properties = await contract.methods.getPropertiesByRevenueDeptId(
                                              revenueDepartmentId
                                              ).call()
                                              .then(function(value){
                                                return value;
                                              });
      console.log(properties);
  
  
      let tableBody = document.getElementById("propertiesTableBody");
  
      let tableBodyCode = "";
      let tableRow = "";
  
      for(let i=0;i<properties.length;i++)
      {
        tableRow = "<tr>";
  
        tableRow += "<td>"+properties[i]["propertyId"]+ "</td>";
        tableRow += "<td>"+properties[i]["locationId"]+ "</td>";
        tableRow += "<td>"+properties[i]["surveyNumber"]+ "</td>";
        tableRow += "<td>"+properties[i]["area"]+ "</td>";
        tableRow += "<td> <button class='pdfButton' onclick=showPdf("+ properties[i]["propertyId"] +")> PDF </button></td>";
  
        
        tableRow += "<td>"+ handleStateOfProperty(properties[i]) + "</td>";

        tableRow += "</tr>";
  
        tableBodyCode += tableRow;
      }
  
      tableBody.innerHTML = tableBodyCode;
  
    }
    catch(error)
    {
      console.log(error);
    }
  
}
  

async function acceptProperty(propertyId)
{
  let contractABI = JSON.parse(window.localStorage.LandRegistry_ContractABI);

  let contractAddress = window.localStorage.LandRegistry_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["employeeId"];

  try{
  
    response = await contract.methods.verifyProperty(
                                            propertyId
                                            ).send({from:accountUsedToLogin})
                                            .then(function(value){
                                              return value;
                                            });
    console.log(response);

    fetchPropertiesUnderControl(window.localStorage.revenueDepartmentId);
 

  }
  catch(error)
  {
    console.log("Error");
    console.log(error);
  }
}


async function rejectProperty(propertyId)
{
  let contractABI = JSON.parse(window.localStorage.LandRegistry_ContractABI);

  let contractAddress = window.localStorage.LandRegistry_ContractAddress;

  let contract = new window.web3.eth.Contract(contractABI,contractAddress);

  let accountUsedToLogin = window.localStorage["employeeId"];

  try{
  
    response = await contract.methods.rejectProperty(
                                            propertyId,
                                            "Documents are Not clear"
                                            ).send({from:accountUsedToLogin})
                                            .then(function(value){
                                              return value;
                                            });
    console.log(response);
    fetchPropertiesUnderControl(window.localStorage.revenueDepartmentId);
 

  }
  catch(error)
  {
    console.log("Error");
    console.log(error);
  }
}


// function to create State of properties
function handleStateOfProperty(property)
{
    properyState = property["state"]

    // 0 => Created: uploaded by user.
    // 1 => Scheduled: Scheduled by Verifier for verification.
    // 2 => Verified: verified by verifier.
    // 3 => Rejected: rejected by verifier.
    // 4 => On Sale : On sale.
    // 5 => Bought : Sell to someon
    if(properyState == 0){
        htmlCode = "<button class='accept' onclick = acceptProperty("+
                    property["propertyId"]+")>Accept</button>"+
                    "<button class='reject'onclick = rejectProperty("+
                    property["propertyId"]+")>Reject</buttion>"
        ;
        return htmlCode;

    }
    else if(properyState == 1){
        return "Scheduled on"+property["scheduledDate"];
    }
    else if(properyState == 2 || properyState == 5 || properyState ==4 )
    {
        return "Accepted";
    }
    else if(properyState == 3)
    {
        let msg = "Rejected:"+property["rejectedReason"];
        return msg;
    }
    else
    {
        console.log("Invalid State")
        return "Invalid"
    }
}



// fucntion to show Registered pdfs
function showPdf(propertyId) {
    const frame = document.getElementById('pdf-frame');
    frame.src = `/propertiesDocs/pdf/${propertyId}`;
    
    const popup = document.querySelector('.pdf-popup');
    popup.style.display = 'block';
  }

function closePopup() {
const popup = document.querySelector('.pdf-popup');
popup.style.display = 'none';
}
