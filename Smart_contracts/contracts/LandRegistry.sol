// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;


import "./Properties.sol";

contract LandRegistry{

    address private contractOwner;
    address private transferOwnershipContractAddress;
    bool private transferOwnershipContractAddressUpdated = false;

    Property public propertiesContract;
    
    
    constructor(){
        contractOwner = msg.sender;
        transferOwnershipContractAddress = address(0);
        transferOwnershipContractAddressUpdated = false;
        propertiesContract = new Property();
    }

    // modifiers 

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Caller is not the owner");
        _;
    }


    modifier onlyRevenueDeptEmployee(uint256 revenueDeptId) {
        require(msg.sender == revenueDeptIdToEmployee[revenueDeptId], "Only the revenue department employee can call this function.");
        _;
    }

    // events
    event LandAdded(address indexed owner,uint256 indexed propertyId);



    // mapping owner and thier properties
    mapping(address => uint256[]) private propertiesOfOwner;

    // mapping revenue Department and properties under control of them 
    // for verification procedures
    mapping(uint256 => uint256[]) private propertiesControlledByRevenueDept;


    
    // mapping of revenue department id to employee address
    mapping (uint256 => address) public revenueDeptIdToEmployee;


    function setTransferOwnershipContractAddress(
        address contractAddress
        ) public {
            
            // This function can be called only once 
            require(transferOwnershipContractAddressUpdated==false,"Allowed Only Once to call");
            
            // setting contract address
            transferOwnershipContractAddress = contractAddress;

            // Make transferOwnership contrat updated as True 
            // So,that no body calls it again
            transferOwnershipContractAddressUpdated = true;
    }




    // add Land and maps to owner
    function addLand(
        uint256 _locationId,
        uint256 _revenueDepartmentId,
        uint256 _surveyNumber,
        uint256 _area
        ) public returns (uint256) {
        
        // check already land present or not 
        // with revernue dept id, location id, survey number

        address _owner = msg.sender;
        uint256 propertyId = propertiesContract.addLand(
                                                        _locationId,
                                                        _revenueDepartmentId,
                                                        _surveyNumber,
                                                        _owner,
                                                        _area
                                                    );


        // adding property id to owner list
        propertiesOfOwner[_owner].push(propertyId);

        // adding property id to revenue department
        propertiesControlledByRevenueDept[_revenueDepartmentId].push(propertyId);


        emit LandAdded(_owner,propertyId);
        
        return propertyId;
    }


    function getPropertyDetails(
        uint256 _propertyId
        ) public view returns (Property.Land memory){

        return propertiesContract.getLandDetailsAsStruct(_propertyId);
    }



    // returns the property details of a owner
    function getPropertiesOfOwner(
        address _owner
        ) public view returns (
        Property.Land[] memory
        ) {
            uint256[] memory propertyIds = propertiesOfOwner[_owner];
            Property.Land[] memory properties = new Property.Land[](propertyIds.length);
            
            for (uint256 i = 0; i < propertyIds.length; i++) {
            //   properties[i] = propertiesContract.lands(propertyIds[i]);
                properties[i] = propertiesContract.getLandDetailsAsStruct(propertyIds[i]);
            }
               
                
            return properties;
    }


    
    // return the property details based on revenue Dept
    function getPropertiesByRevenueDeptId(
        uint256 _revenueDeptId
        ) public view returns (
        Property.Land[] memory
        ) {
            uint256[] memory propertyIds = propertiesControlledByRevenueDept[_revenueDeptId];
            
            Property.Land[] memory properties = new Property.Land[](propertyIds.length);
            
            for (uint256 i = 0; i < propertyIds.length; i++) {
            //   properties[i] = propertiesContract.lands(propertyIds[i]);
                properties[i] = propertiesContract.getLandDetailsAsStruct(propertyIds[i]);
            }
               
                
            return properties;
    }
            

    // map to revenue department id to employee address
    function mapRevenueDeptIdToEmployee(
        uint256 revenueDeptId, 
        address employeeAddress
        ) public onlyOwner {
        
        revenueDeptIdToEmployee[revenueDeptId] = employeeAddress;
    }


    function getRevenueDeptId(uint256 propertyId) private view returns (uint256) {
        return propertiesContract.getLandDetailsAsStruct(propertyId).revenueDepartmentId;
    }

    function verifyProperty(
        uint256 _propertyId
        ) public onlyRevenueDeptEmployee(getRevenueDeptId(_propertyId)) {
        
        propertiesContract.changeStateToVerifed(_propertyId, msg.sender);

    }

    function rejectProperty(
        uint256 _propertyId,
        string memory _reason
        ) public onlyRevenueDeptEmployee(getRevenueDeptId(_propertyId)) {
        
            propertiesContract.changeStateToRejected(_propertyId, msg.sender,_reason);

    }




    function transferOwnership(uint256 _propertyId, address newOwner) public {
        
        require(msg.sender==transferOwnershipContractAddress,"Only TransferOfOwnerShip Contract Allowed");
        
        // Remove property from old owner's list
        address oldOwner  = propertiesContract.getLandDetailsAsStruct(_propertyId).owner;

        uint256[] storage propertiesOfOldOwner = propertiesOfOwner[oldOwner];
        for (uint i = 0; i < propertiesOfOldOwner.length; i++) {
            if (propertiesOfOldOwner[i] == _propertyId) {
                propertiesOfOldOwner[i] = propertiesOfOldOwner[propertiesOfOldOwner.length - 1];
                propertiesOfOldOwner.pop();
                break;
            }
        }

        // Add Property to new owner's list
        propertiesOfOwner[newOwner].push(_propertyId);

        propertiesContract.updateOwner(_propertyId, newOwner);

        

    }

    function getPropertiesContract() public view returns (address){
        return address(propertiesContract);
    }
   
}

