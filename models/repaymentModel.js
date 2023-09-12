import mongoose from "mongoose";

const repaymentSchema = new mongoose.Schema({
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loan",
    required: true,
  },
  repayments: [
    {
      dueDate: {
        type: Date,
        required: true,
      },
      repaymentAmount: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: ["PAY", "PAID"],
        default: "PAY",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Repayment = mongoose.model("Repayment", repaymentSchema);

export default Repayment;
