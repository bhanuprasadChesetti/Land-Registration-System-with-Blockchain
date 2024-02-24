// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;


import "./Properties.sol";
import "./LandRegistry.sol";

contract TransferOwnerShip{

    // ######################################################################
    //              TRANSFER OWNERSHIP OF PROPERTY
    // ######################################################################
    


    Property private propertiesContract;
    LandRegistry private LandRegistryContract;



    constructor(address _landRegistryContractAddress){
        // Creating Land Registry Object
        LandRegistryContract = LandRegistry(_landRegistryContractAddress);
        
        address propertiesContractAddress = LandRegistryContract.getPropertiesContract();  
        propertiesContract = Property(propertiesContractAddress);

        LandRegistryContract.setTransferOwnershipContractAddress(address(this));
    }
   

    
    
    // ******** Enumerators ************
    
    // Active :
    //   on creation of sale by owner
    
    // AcceptedToABuyer :
    //   on accepting a buyer request
    
    // CancelSaleBySeller   : 
    //   on canceling of sale by owner
    
    // DeadlineOverForPayment : 
    //   if payment deadline is over by buyer
    
    // Success :
    //   on successful payment and ownership transfer 
    
    // CancelAcceptanceRequestGivenBySeller : 
    //   seller has accepted purchase request of a buyer and later,seller again rejected it
    
    // RejectedAcceptanceRequestByBuyer : 
    //    Buyer rejected acceptance request given by seller

    enum SaleState {
        Active,  
        AcceptedToABuyer,
        CancelSaleBySeller,
        Success,
        DeadlineOverForPayment,
        CancelAcceptanceRequestGivenBySeller,
        RejectedAcceptanceRequestByBuyer

    }

    /*
    // states of buyer that requested to purchase a sale
   
    // SentPurchaseRequest : 
    //   Buyer has sent purchase request to a seller
    
    // CancelPurchaseRequest :
    //   Buyer wants to cancel purchase request sent. 

    // SellerAcceptedPurchaseRequest :
    //   Seller Accepted Purchase Request of a Buyer

    // SellerRejectedPurchaseRequest :
    //    Seller Rejected Purchase Request 

    // SellerCanceledAcceptanceRequest :
    //    Seller has canceled acceptance request granted.
    //    Allowed to do before buyer done payment only.

    // YouRejectedAcceptanceRequest :
    //    Buyer himself/herself wants to rejecte acceptance request

    // ReRequestedPurchaseRequest :
    //    Buyer Re-requesting for purchase  
    //    on deadlin over or owner may rejected by a reason.

    */
    enum RequestedUserToASaleState {
        SentPurchaseRequest,
        CancelPurchaseRequest,

        SellerAcceptedPurchaseRequest,
        SellerRejectedPurchaseRequest,

        SellerCanceledAcceptanceRequest,
        YouRejectedAcceptanceRequest,

        ReRequestedPurchaseRequest,

        SuccessfullyTransfered
    }



    // ****************** Structures ********************

    struct RequestedUser {
            address user;
            uint256 priceOffered;
            RequestedUserToASaleState state;
    }


    struct Sales {
        uint256 saleId;
        address owner;
        uint256 price;
        uint256 propertyId;
        address acceptedFor;
        uint256 acceptedPrice;
        uint256 acceptedTime;
        uint256 deadlineForPayment;
        bool paymentDone;
        SaleState state;
    }


    // *******  Public variables *********
    Sales[] private sales;


    // *********** MAPPINGS  *************
    
    // mapping of address and their properties which are on sale to sell.
    mapping(address => uint256[]) private salesOfOwner;

    // mapping of address and their requested properties to purchase
    mapping(address => uint256[]) public requestedSales;

    // mapping of sale id to requested user details
    mapping(uint256 => RequestedUser[]) requestedUsers;
        
    // mapping of location to the sale id available to purchase
    mapping(uint256 => uint256[]) private propertiesOnSaleByLocation;



    // ********** EVENTS     *************
    event PropertyOnSale(address indexed owner, uint256 indexed propertyId, uint256 saleId);

    event PurchaseRequestSent(uint256 saleId, address requestedUser, uint256 priceOffered);

    event SaleAccepted(uint256 saleId, address buyer, uint256 price, uint256 deadline);


    // ************ FUNCTIONS ************

    // Conversion function from Ether to Wei
    function convertToWei(uint256 etherValue) public pure returns (uint256) {
        return etherValue * 1 ether;
    }


    // add Property on Sale
    function addPropertyOnSale(
        uint256 _propertyId,
        uint256 _price
        ) public {
        
        require(msg.sender == propertiesContract.getLandDetailsAsStruct(_propertyId).owner, "Only the owner can put the property on sale.");

        // add property id to list of properties that are available to sold on a loaction
        uint256[] storage propertiesOnSale = propertiesOnSaleByLocation[propertiesContract.getLandDetailsAsStruct(_propertyId).locationId];
        
        propertiesOnSale.push(sales.length);

        // converting price  from ether to wei format
        _price = convertToWei(_price);

        Sales memory newSale = Sales({
            saleId: sales.length,
            owner: msg.sender,
            price: _price,
            propertyId: _propertyId,
            acceptedFor: address(0),
            acceptedPrice: 0,
            acceptedTime: 0,
            deadlineForPayment: 0,
            paymentDone : false,
            state : SaleState.Active

        });

        sales.push(newSale);


        // //Create a new storage array of the same length
        // requestedUsers[newSale.saleId].push(
        //     RequestedUser({
        //         user : address(0),
        //         priceOffered :0
        //     })
        // );


        // add sale to the owner's sales array
        salesOfOwner[msg.sender].push(newSale.saleId);

        propertiesContract.changeStateToOnSale(_propertyId, msg.sender);

        emit PropertyOnSale(msg.sender, _propertyId, newSale.saleId);
    }


    // function for getting all properties which are on sale of a owner
    function getMySales(
        address _owner
        ) public view returns (Sales[] memory) {

        uint256[] memory saleIds = salesOfOwner[_owner];
        Sales[] memory ownerSales = new Sales[](saleIds.length);

        for (uint256 i = 0; i < saleIds.length; i++) {
            ownerSales[i] = sales[saleIds[i]];
        }

        return ownerSales;
    }


    // Function to get all requested user details
    function getRequestedUsers(
        uint256 saleId
        ) public view returns (RequestedUser[] memory) {
        return requestedUsers[saleId];
    }


    // function to get all my requested sales to purchase of a buyer
    function getRequestedSales(
        address _owner
        ) public view returns (Sales[] memory) {

        uint256[] memory saleIds = requestedSales[_owner];
        Sales[] memory myRequestedSales = new Sales[](saleIds.length);

        for (uint256 i = 0; i < saleIds.length; i++) {
            myRequestedSales[i] = sales[saleIds[i]];
        }

        return myRequestedSales;
    }


    // function to return status of buyer reuest to purchase
    // It returns partiuclar buyer details 
    // from requestedUser[saleid].
    function getStatusOfPurchaseRequest(
        uint256 _saleId
        ) public view returns (RequestedUser memory) {

        // Gettin index value of buyer in 
        // requestedUsers of a sale to purchase.
        bool buyerFound = false;
        uint i = 0;
        for (i = 0; i < requestedUsers[_saleId].length; i++) 
        {
            if (requestedUsers[_saleId][i].user == msg.sender) {
                buyerFound = true;
                break;
            }
        }


        if(buyerFound == true){
            return (RequestedUser({
                user:requestedUsers[_saleId][i].user,
                priceOffered:requestedUsers[_saleId][i].priceOffered, 
                state:requestedUsers[_saleId][i].state
            }));
        }
        else
        {
            return (RequestedUser({
                user:address(0),
                priceOffered:0, 
                state:RequestedUserToASaleState.SentPurchaseRequest
            }));
        }
        

    }

    // return all sales in that location
    function getSalesByLocation(
        uint256 locationId
        ) public view returns (Sales[] memory) {
        
            uint256[] memory saleIds = propertiesOnSaleByLocation[locationId];
            
            Sales[] memory salesGoingOnThisLocation = new Sales[](saleIds.length);

            for (uint256 i = 0; i < saleIds.length; i++) {
                salesGoingOnThisLocation[i] = sales[saleIds[i]];
            }
            return salesGoingOnThisLocation;
    }



    // send purchase request to seller  to buy a land from buyer
    function sendPurchaseRequest(
        uint256 _saleId, 
        uint256 _priceOffered
        ) public {
    
            // Get the sales details
            Sales storage sale = sales[_saleId];
            
            // Make sure the sale exists
            require(sale.propertyId != 0, "Sale does not exist");
            
            // Make Sure that Sale is not accepted 
            require(sale.state == SaleState.Active,"Property Not in Active State to Purchase");

            // Add the request to the requested users array of sale
            requestedUsers[sale.saleId].push(
                RequestedUser({
                user: msg.sender,
                priceOffered: convertToWei(_priceOffered),
                state: RequestedUserToASaleState.SentPurchaseRequest
            }));
            
            // add sale id to myrequested sales
            requestedSales[msg.sender].push(sale.saleId);

            // Emit an event
            emit PurchaseRequestSent(_saleId, msg.sender, _priceOffered);
    }



    // function to accept buyer request 
    function acceptBuyerRequest(
        uint256 _saleId,
        address _buyer,
        uint256 _price
        ) public {

            _price = convertToWei(_price);

            // Find the sale object by its ID
            Sales storage sale = sales[_saleId];

            // Make sure the sale exists
            require(sale.propertyId != 0, "Sale does not exist");

            // Make sure the sale exists
            require(sale.state == SaleState.Active, "Sale is Not Active");


            // Only owner of property can be allowed
            require(msg.sender == propertiesContract.getLandDetailsAsStruct(sale.propertyId).owner, "Only the owner can accept the purchase request.");


            // Make sure the buyer has made a request and the price is greater than or equal to the owner's set price
            require(requestedUsers[sale.saleId].length > 0, "No buyer requests found");

            // checking buyer has sent request or not
            bool buyerFound = false;
            uint i = 0;
            for (i = 0; i < requestedUsers[sale.saleId].length; i++) {
                if (requestedUsers[sale.saleId][i].user == _buyer) {
                    buyerFound = true;
                    break;
                }
            }
            require(buyerFound, "Buyer not found in requested user array");

            require(_price == requestedUsers[sale.saleId][i].priceOffered, "Price sent by seller not equal to price offered by buyer");



            // Update the sale object with buyer information
            sale.acceptedFor = _buyer;
            sale.acceptedPrice = _price;
            sale.acceptedTime = block.timestamp;
            sale.deadlineForPayment = block.timestamp + 5 minutes;
            
            sale.state = SaleState.AcceptedToABuyer;


            // Update the state of requested buyer
            requestedUsers[sale.saleId][i].state = RequestedUserToASaleState.SellerAcceptedPurchaseRequest;


            // // Remove the buyer request from the sale's requested users array
            // for (uint i = 0; i < sale.requestedUsers.length; i++) {
            //     if (sale.requestedUsers[i].requestedUser == _buyer) {
            //         delete sale.requestedUsers[i];
            //         sale.requestedUsers[i] = sale.requestedUsers[sale.requestedUsers.length - 1];
            //         sale.requestedUsers.pop();
            //         break;
            //     }
            // }

            emit SaleAccepted(_saleId, _buyer, _price, sale.deadlineForPayment);
    }


    // function to canel sale created by seller
    function cancelSaleBySeller(uint256 _saleId) public returns (bool){

        Sales storage sale = sales[_saleId];
        
        require(sale.owner == msg.sender, "Only property owner can cancel sale");
        require(!sale.paymentDone, "Payment has already been made");
        require(sale.state != SaleState.Success, "Successed Sale Can't be Canceled.");
        require(sale.state != SaleState.CancelSaleBySeller, "Sale is Already Cancelled");
        require(sale.state != SaleState.AcceptedToABuyer, "Accepted To Buyer,Can't Cancel Sale.Please Cancel Acceptanc First");

        sale.state = SaleState.CancelSaleBySeller;
        sale.acceptedFor = address(0);
        sale.acceptedPrice = 0;
        sale.acceptedTime = 0;
        sale.deadlineForPayment = 0;
        sale.paymentDone = false;

        // change state of property again back to verified
        propertiesContract.changeStateBackToVerificed(sale.propertyId, msg.sender);

        return true;
    }


    // Reactive sale when deadline is over
    function reactivateSale(uint256 _saleId) public {

        Sales storage sale = sales[_saleId];

        require(sale.owner == msg.sender, "Only property owner can Re-activate");
        require(sale.state != SaleState.Active , "Sale is Already in Active State");
        require(sale.state != SaleState.CancelSaleBySeller, "Closed Sale can't be reactivated.Please Create New Sale");
        require(sale.state != SaleState.AcceptedToABuyer, "Closed Sale can't be reactivated.Please Create New Sale");
        require(sale.state != SaleState.Success, "Successed Sale can't be reactivated.");
        
        sale.state = SaleState.Active;
        sale.acceptedFor =  address(0);
        sale.acceptedPrice =  0;
        sale.acceptedTime =  0;
        sale.deadlineForPayment =  0;
        sale.paymentDone  =  false;
    }


    // Buyer can rejects acceptance request for payment 
    function rejectingAcceptanceRequestByBuyer(uint256 _saleId) public {
        Sales storage sale = sales[_saleId];

        // Check that the sale state is either "accepted" or "deadlineOver"
        require(sale.state == SaleState.AcceptedToABuyer || sale.state == SaleState.DeadlineOverForPayment, "Sale state does not allow cancellation");

        // Check that the sale was accepted by the caller
        require(sale.acceptedFor == msg.sender, "Not Authorized to Reject Acceptance Request of Seller");


        // Reset the sale state to "RejectedAcceptanceRequestByBuyer"
        sale.state = SaleState.RejectedAcceptanceRequestByBuyer;


        // Gettin index value of buyer in 
        // requestedUsers of a sale to purchase.
        bool buyerFound = false;
        uint i = 0;
        for (i = 0; i < requestedUsers[sale.saleId].length; i++) {
            if (requestedUsers[sale.saleId][i].user == msg.sender) {
                buyerFound = true;
                break;
            }
        }

        // Change State of Buyer in RequesteUsers of a Sale.
        requestedUsers[sale.saleId][i].state = RequestedUserToASaleState.YouRejectedAcceptanceRequest;

        // Emit event
        // emit SaleCanceled(_saleId);
    }


    // function to cancel acceptance request by seller 
    // allowed only before payment
    function rejectingAcceptanceRequestBySeller(uint256 _saleId) public{
        Sales storage sale = sales[_saleId];

        // Check that the sale state is either "accepted" or "deadlineOver"
        require(sale.state == SaleState.AcceptedToABuyer || sale.state == SaleState.DeadlineOverForPayment, "Sale state does not allow cancellation");

        // Check that the sale was accepted by the caller
        require(sale.owner == msg.sender, "Not Authorized to Cancel Acceptance Request of Buyer");


        address acceptedBuyer = sale.acceptedFor;

        // Reset the sale state to "CancelAcceptanceRequestGivenBySeller"
        sale.state = SaleState.CancelAcceptanceRequestGivenBySeller;
        sale.acceptedFor = address(0);
        sale.acceptedPrice = 0;
        sale.acceptedTime = 0;
        sale.deadlineForPayment = 0;
        sale.paymentDone = false;


        // Gettin index value of buyer in 
        // requestedUsers of a sale to purchase.
        bool buyerFound = false;
        uint i = 0;
        for (i = 0; i < requestedUsers[sale.saleId].length; i++) {
            if (requestedUsers[sale.saleId][i].user == acceptedBuyer) {
                buyerFound = true;
                break;
            }
        }

        // Change State of Buyer in RequesteUsers of a Sale.
        requestedUsers[sale.saleId][i].state = RequestedUserToASaleState.SellerCanceledAcceptanceRequest;

    }



    // function to cancel purchase request sent to seller from buyer
    function cancelPurchaseRequestSentToSeller(uint256 _saleId) public {
        
        Sales storage sale = sales[_saleId];

        // Check that the sale state is active
        require(sale.state == SaleState.Active, "Sale state does not allow cancellation");

        // Gettin index value of buyer in 
        // requestedUsers of a sale to purchase.
        bool buyerFound = false;
        uint i = 0;
        for (i = 0; i < requestedUsers[sale.saleId].length; i++) {
            if (requestedUsers[sale.saleId][i].user == msg.sender) {
                buyerFound = true;
                break;
            }
        }

        require(buyerFound,"Only Requested Buyers can cancel");

        // Change State of Buyer in RequesteUsers of a Sale.
        requestedUsers[sale.saleId][i].state = RequestedUserToASaleState.CancelPurchaseRequest;


    }



     // function to reject purchase request sent by buyer from seller
    function rejectPurchaseRequestOfBuyer(
        uint256 _saleId,
        address _buyer
        ) public {
        
        Sales storage sale = sales[_saleId];

        // only owner of sale can reject purchase request of buyer
        require(sale.owner == msg.sender,"Only Owner is allowed");
        // Check allowed states
        require(sale.state != SaleState.CancelSaleBySeller,"Can't do operation on Canceled sale");
        require(sale.state != SaleState.Success,"Can't do operation on Closed Sale");
       

        // Gettin index value of buyer in 
        // requestedUsers of a sale to purchase.
        bool buyerFound = false;
        uint i = 0;
        for (i = 0; i < requestedUsers[sale.saleId].length; i++) {
            if (requestedUsers[sale.saleId][i].user == _buyer) {
                buyerFound = true;
                break;
            }
        }

        require(buyerFound,"Buyer is not Requested to purchase");

        // Change State of Buyer in RequesteUsers of a Sale.
        requestedUsers[sale.saleId][i].state = RequestedUserToASaleState.SellerRejectedPurchaseRequest;


    }



    // function to re-request purchase request
    function rerequestPurchaseRequest(
        uint256 _saleId, 
        uint256 _priceOffered
        ) public {
    
            // Get the sales details
            Sales storage sale = sales[_saleId];
            
            // Make sure the sale exists
            require(sale.propertyId != 0, "Sale does not exist");
            
            // Make sure that sale is active state
            require(sale.state == SaleState.Active, "Sale is Not Active");

             // Gettin index value of buyer in 
            // requestedUsers of a sale to purchase.
            bool buyerFound = false;
            uint i = 0;
            for (i = 0; i < requestedUsers[sale.saleId].length; i++) {
                if (requestedUsers[sale.saleId][i].user == msg.sender) {
                    buyerFound = true;
                    break;
                }
            }

            // checking existed buyer or not
            require(buyerFound,"Buyer Not found in Requested List");

            // allowed states
            require(requestedUsers[sale.saleId][i].state != RequestedUserToASaleState.SentPurchaseRequest,"State Not Allowed to Re-sent Purchase Request");
            require(requestedUsers[sale.saleId][i].state != RequestedUserToASaleState.SellerAcceptedPurchaseRequest,"State Not Allowed to Re-sent Purchase Request");
            require(requestedUsers[sale.saleId][i].state != RequestedUserToASaleState.ReRequestedPurchaseRequest,"State Not Allowed to Re-sent Purchase Request");
    

            // Reset Buyer in RequesteUsers of a Sale.
            requestedUsers[sale.saleId][i].state = RequestedUserToASaleState.ReRequestedPurchaseRequest;
            requestedUsers[sale.saleId][i].priceOffered = convertToWei(_priceOffered);
                        
            // Emit an event
            emit PurchaseRequestSent(_saleId, msg.sender, _priceOffered);
    }

   
    // function to transfer owner ship 
    function transferOwnerShip(
        uint256 saleId
        ) public payable {

            Sales storage sale = sales[saleId];
            
            require(msg.sender == sale.acceptedFor, "Only accepted buyer can complete the sale");

            require(msg.value == sale.acceptedPrice, "Payment amount must be equal to accepted price");

            require(block.timestamp <= sale.deadlineForPayment, "Payment deadline has passed");
            

            // Gettin index value of buyer in 
            // requestedUsers of a sale to purchase.
            bool buyerFound = false;
            uint i = 0;
            for (i = 0; i < requestedUsers[sale.saleId].length; i++) {
                if (requestedUsers[sale.saleId][i].user == msg.sender) {
                    buyerFound = true;
                    break;
                }
            }

            // checking existed buyer or not
            require(buyerFound,"Buyer Not found in Requested List");
            

            // transfer payment to property owner
            payable(sale.owner).transfer(msg.value);

            // transfer ownership of property to buyer
            LandRegistryContract.transferOwnership(sale.propertyId, msg.sender);
            
           // chaging state of Requested user to successfully transformed
           requestedUsers[sale.saleId][i].state = RequestedUserToASaleState.SuccessfullyTransfered;

            // Remove sale from availabel sales by location

            uint256 _location = propertiesContract.getLandDetailsAsStruct(sale.propertyId).locationId;

            uint256[] storage propertiesOnSale = propertiesOnSaleByLocation[_location];

            for (i = 0; i < propertiesOnSale.length; i++) {
                if (propertiesOnSale[i] == sale.saleId) {
                    propertiesOnSale[i] = propertiesOnSale[propertiesOnSale.length - 1];
                    propertiesOnSale.pop();
                    break;
                }
            }
            

            sale.state = SaleState.Success;

            // // remove sale from buyer's requested sales
            // delete requestedSales[msg.sender][saleId];
            
            // // emit event
            // emit SaleCompleted(saleId, msg.sender, sale.acceptedPrice);
    }

}