import { toast } from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiconnector";
import rzpLogo from "../../assets/Logo/rzp_logo.png";
import { setPaymentLoading } from "../../slices/courseSlice";
import { resetCart } from "../../slices/cartSlice";

const { COURSE_PAYMENT_API, COURSE_VERIFY_API, SEND_PAYMENT_SUCCESS_EMAIL_API } = studentEndpoints;

function loadScript(src) {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export async function buyCourse(token, courses, userDetails, navigate, dispatch) {
    const toastId = toast.loading("Loading...");
    try {
        // ✅ Load Razorpay script
        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!res) {
            toast.error("RazorPay SDK failed to load");
            return;
        }

        // ✅ Initiate the order
        const orderResponse = await apiConnector("POST", COURSE_PAYMENT_API, 
            { courses }, 
            { Authorization: `Bearer ${token}` }
        );

        console.log("✅ ORDER RESPONSE:", orderResponse); // Log API response

        // ✅ Fix: Access API response correctly
        if (!orderResponse?.data?.success) {
            console.error("❌ ORDER RESPONSE ERROR:", orderResponse);
            throw new Error(orderResponse?.data?.message || "Unknown error in payment API");
        }

        const orderData = orderResponse.data.data; // ✅ Corrected data extraction

        // ✅ Setup Razorpay options
        const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY,
            currency: orderData.currency,
            amount: `${orderData.amount}`,
            order_id: orderData.id,
            name: "StudyNotion",
            description: "Thank You for Purchasing the Course",
            image: rzpLogo,
            prefill: {
                name: `${userDetails.firstName}`,
                email: userDetails.email,
            },
            handler: function (response) {
                sendPaymentSuccessEmail(response, orderData.amount, token);
                verifyPayment({ ...response, courses }, token, navigate, dispatch);
            },
        };

        const paymentObject = new window.Razorpay(options);

        // ✅ Attach event listener BEFORE opening payment modal
        paymentObject.on("payment.failed", function (response) {
            toast.error("Oops, payment failed");
            console.error("❌ Payment Failed:", response.error);
        });

        // ✅ Open Razorpay modal
        paymentObject.open();
    } catch (error) {
        console.error("❌ PAYMENT API ERROR:", error);
        toast.error("Could not complete payment");
    }
    toast.dismiss(toastId);
}


async function sendPaymentSuccessEmail(response, amount, token) {
    try {
        const emailResponse = await apiConnector("POST", SEND_PAYMENT_SUCCESS_EMAIL_API, {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            amount,
        }, {
            Authorization: `Bearer ${token}`,
        });

        console.log("✅ PAYMENT SUCCESS EMAIL SENT:", emailResponse);
    } catch (error) {
        console.error("❌ PAYMENT SUCCESS EMAIL ERROR:", error);
        toast.error("Failed to send payment success email");
    }
}

async function verifyPayment(bodyData, token, navigate, dispatch) {
    const toastId = toast.loading("Verifying Payment...");
    dispatch(setPaymentLoading(true));

    try {
        const response = await apiConnector("POST", COURSE_VERIFY_API, bodyData, {
            Authorization: `Bearer ${token}`,
        });

        console.log("✅ PAYMENT VERIFICATION RESPONSE:", response);

        if (!response || !response.success) {
            throw new Error(response?.message || "Payment verification failed.");
        }

        toast.success("Payment Successful! You are enrolled.");
        navigate("/dashboard/enrolled-courses");
        dispatch(resetCart());
    } catch (error) {
        console.error("❌ PAYMENT VERIFY ERROR:", error);
        toast.error("Could not verify payment");
    }

    toast.dismiss(toastId);
    dispatch(setPaymentLoading(false));
}
