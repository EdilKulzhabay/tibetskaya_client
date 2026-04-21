import mongoose from "mongoose";

const ClientPaymentSchema = new mongoose.Schema(
    {
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true,
            index: true,
        },
        paidAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },
        amount: { type: Number, required: true },
        currency: { type: String, default: "KZT" },
        status: {
            type: String,
            required: true,
            enum: ["success", "fail"],
            index: true,
        },
        cardLast4: { type: String, default: null, maxlength: 4 },
        sessionOrderId: { type: String, index: true },
        providerInvoiceId: { type: String, default: null },
        rawProviderStatus: { type: String, default: null },
    },
    { timestamps: true }
);

export default mongoose.model("ClientPayment", ClientPaymentSchema);
