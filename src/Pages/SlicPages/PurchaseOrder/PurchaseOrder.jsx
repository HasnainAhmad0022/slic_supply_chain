import React, { useEffect, useState } from "react";
import SideNav from "../../../components/Sidebar/SideNav";
import { useNavigate } from "react-router-dom";
import { purchaseOrderColumn, purchaseOrderDetailsColumn } from "../../../utils/datatablesource";
import DataTable from "../../../components/Datatable/Datatable";
import newRequest from "../../../utils/userRequest";
import { toast } from "react-toastify";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";
import AddPurchaseOrderPopUp from "./AddPurchaseOrderPopUp";
import { Button } from "@mui/material";
import UpdatePurchaseOrderPopUp from "./UpdatePurchaseOrderPopUp";

const PurchaseOrder = () => {
  const [data, setData] = useState([]);
  const memberDataString = sessionStorage.getItem("slicUserData");
  const memberData = JSON.parse(memberDataString);
  // console.log(memberData)
  const token = JSON.parse(sessionStorage.getItem("slicLoginToken"));


  const [isLoading, setIsLoading] = useState(true);
  const [secondGridData, setSecondGridData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // for the map markers
  const navigate = useNavigate();
  const [isPurchaseOrderDataLoading, setIsPurchaseOrderDataLoading] = useState(false);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // const response = await newRequest.get('/foreignPO/v1/foreignPO/all', {
      const response = await newRequest.post(
        '/slicuat05api/v1/getApi',
        {
          filter: {},
          M_COMP_CODE: "SLIC",
          M_USER_ID: "SYSADMIN",
          APICODE: "ListOfPO",
          M_LANG_CODE: "ENG"
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data);
      
      // Map the API response to the expected data structure
      const mappedData = response.data.map(item => ({
        Head_SYS_ID: item.ListOfPO.HEAD_SYS_ID,
        SupplierName: item.ListOfPO.SUPP_NAME,
        Document_No: item.ListOfPO.DOC_NO,
        POStatus: item.ListOfPO.STATUS,
        PODate: item.ListOfPO.DOC_DT,
      }));

      setData(mappedData);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      toast.error(err?.response?.data?.message || "Something went Wrong");
    }
  };  

    useEffect(() => {
    fetchData(); // Calling the function within useEffect, not inside itself
  }, []);


  const handleRowClickInParent = async (item) => {
    // console.log(item)
    if (item.length === 0) {
      setFilteredData(secondGridData);
      return;
    }

    // call api
    setIsPurchaseOrderDataLoading(true);
    try {
      const res = await newRequest.post(
        '/slicuat05api/v1/getApi',
        {
          filter: {
            P_PI_PH_SYS_ID: item[0]?.Head_SYS_ID
          },
          M_COMP_CODE: "SLIC",
          M_USER_ID: "SYSADMIN",
          APICODE: "ListOfPOItem",
          M_LANG_CODE: "ENG"
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(res?.data);

      // Map the response data to the expected structure for the second grid
      const mappedData = res?.data.map(item => ({
        GRADE: item.ListOfPOItem.GRADE,
        ITEM_CODE: item.ListOfPOItem.ITEM_CODE,
        ITEM_NAME: item.ListOfPOItem.ITEM_NAME,
        ITEM_SYS_ID: item.ListOfPOItem.ITEM_SYS_ID,
        PO_QTY: item.ListOfPOItem.PO_QTY,
        RECEIVED_QTY: item.ListOfPOItem.RECEIVED_QTY,
        UOM: item.ListOfPOItem.UOM,
      }));

      setFilteredData(mappedData);
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message ||"Something went wrong");
      setFilteredData([]);
    } finally {
      setIsPurchaseOrderDataLoading(false);
    }
  };



  const [isCreatePopupVisible, setCreatePopupVisibility] = useState(false);
  const handleShowCreatePopup = () => {
    setCreatePopupVisibility(true);
  };


  const [isUpdatePopupVisible, setUpdatePopupVisibility] = useState(false);
  const handleShowUpdatePopup = (row) => {
    setUpdatePopupVisibility(true);
    // console.log(row)
    sessionStorage.setItem("updatePurchaseOrderData", JSON.stringify(row));
  };


  const handleDelete = (row) => {
    // console.log(row);
    Swal.fire({
      title: `${'Are you sure to delete this record?'}!`,
      text: `${'You will not be able to recover this Purchase Order'}!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `${'Yes Delete'}!`,
      cancelButtonText: `${'No, keep it'}!`,
      confirmButtonColor: '#1E3B8B',
      cancelButtonColor: '#FF0032',
    }).then((result) => {
      if (result.isConfirmed) {
        const deletePromise = new Promise(async (resolve, reject) => {
          try {
            const response = await newRequest.delete("/foreignPO/v1/foreignPO/" + row?.tblPOFPOMasterID);
            if (response) {
              // await refetch();
              resolve(response?.data?.message || 'Products deleted successfully');
              const updatedData = data.filter(item => item.tblPOFPOMasterID !== row.tblPOFPOMasterID);
              setData(updatedData);
            } else {
              reject(new Error('Failed to delete product'));
            }
          } catch (error) {
            console.error("Error deleting product:", error);
            reject(error);
          }
        });
  
        toast.promise(
          deletePromise,
          {
            pending: 'Deleting product...',
            success: {
              render({ data }) {
                return data;
              }
            },
            error: {
              render({ data }) {
                return data.message || 'Failed to delete product';
              }
            }
          }
        );
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        return;
      }
    });
  };

  return (
    <SideNav>
      <div
        className='p-3 h-full'
      >
        {/* <div
          className={`flex justify-start items-center flex-wrap gap-2 py-3 px-3`}
        >
          <Button
            variant="contained"
            onClick={handleShowCreatePopup}
            style={{ backgroundColor: "#CFDDE0", color: "#1D2F90" }}
            // startIcon={<PiBarcodeDuotone />}
          >
            Add Purchase Order
          </Button>
        </div> */}
        <div className="h-auto w-full shadow-xl">
          <div
            style={{
              marginLeft: "-11px",
              marginRight: "-11px",
            }}
          >
            <DataTable
              data={data}
              title={"Purchase Order"}
              columnsName={purchaseOrderColumn}
              loading={isLoading}
              secondaryColor="secondary"
              checkboxSelection="disabled"
              handleRowClickInParent={handleRowClickInParent}
              actionColumnVisibility={false}
              dropDownOptions={[
                {
                  label: "Edit",
                  icon: (
                    <EditIcon
                      fontSize="small"
                      color="action"
                      style={{ color: "rgb(37 99 235)" }}
                    />
                  ),
                  action: handleShowUpdatePopup,
                },
                {
                  label: "Delete",
                  icon: (
                    <DeleteIcon
                      fontSize="small"
                      color="action"
                      style={{ color: "rgb(37 99 235)" }}
                    />
                  ),
                  action: handleDelete,
                },
              ]}
              uniqueId="assemblingId"
            />
          </div>
        </div>

        <div style={{ marginLeft: "-11px", marginRight: "-11px" }}>
          <DataTable
            data={filteredData}
            title={"Purchase Order Details"}
            secondaryColor="secondary"
            columnsName={purchaseOrderDetailsColumn}
            backButton={true}
            checkboxSelection="disabled"
            actionColumnVisibility={false}
            // dropDownOptions={[
            //   {
            //     label: "Delete",
            //     icon: <DeleteIcon fontSize="small" style={{ color: '#FF0032' }} />
            //     ,
            //     action: handleShipmentDelete,
            //   },
            // ]}
            uniqueId={"shipmentRequestProductId"}
            loading={isPurchaseOrderDataLoading}
          />
        </div>


        {isCreatePopupVisible && (
          <AddPurchaseOrderPopUp
            isVisible={isCreatePopupVisible}
            setVisibility={setCreatePopupVisibility}
            refreshGTINData={fetchData}
          />
        )}


        {isUpdatePopupVisible && (
          <UpdatePurchaseOrderPopUp
            isVisible={isUpdatePopupVisible}
            setVisibility={setUpdatePopupVisibility}
            refreshGTINData={fetchData}
          />
        )}
      </div>
    </SideNav>
  );
};

export default PurchaseOrder;
