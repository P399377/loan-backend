import mongoose from "mongoose";

const loanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
  },
  loanName: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  term: {
    type: Number,
    required: true,
  },
  remainingTerm: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "DECLINED", "PAID"],
    default: "PENDING",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Loan = mongoose.model("Loan", loanSchema);
export default Loan;
