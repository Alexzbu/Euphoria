import { Toaster } from "react-hot-toast"

const MyToaster = () => {
   return (
      <Toaster
         toastOptions={{
            style: {
               background: "#6620c1",
               color: "#fff",
               fontSize: "20px",
               borderRadius: "10px",
               width: "100%",
               maxWidth: "600px"
            },
            success: {
               style: { background: "green", color: "#fff" },
            },
            error: {
               style: { background: "red", color: "#fff" },
            },
         }}
      />
   )
};

export default MyToaster