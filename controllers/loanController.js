// Loan request function
import Loan from "../models/loanModel.js";
import Repayment from "../models/repaymentModel.js";

export const loanRequest = async (req, res) => {
  try {
    //Check if the user is not an admin
    if (req.user.role !== "user") {
      return res.status(400).json({
        success: false,
        message: "Only users can make a loan request",
      });
    }

    const { amount, term } = req.body;

    // Check if any of the required fields is missing
    if (!amount || !term) {
      return res.status(400).json({
        success: false,
        message: "loanName, amount, and term are required fields",
      });
    }

    // Create a new loan request in the database
    await Loan.create({
      userId: req.user._id,
      amount,
      term,
      remainingTerm: term,
      name: req.user.name,
    });

    res.status(201).json({
      success: true,
      message: "Loan request created",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Approve a loan request
export const loanApprove = async (req, res) => {
  try {
    // Extract the loanId field from the request body
    const { loanId } = req.body;

    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: "loanId is a required field",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Only admins can approve loans",
      });
    }

    const findLoan = await Loan.findById(loanId);

    if (!findLoan) {
      return res.status(400).json({
        success: false,
        message: "No loan associated with the given loanId",
      });
    }

    if (findLoan.status === "APPROVED" || findLoan.status === "DECLINED") {
      return res.status(400).json({
        success: false,
        message: "The loan associated with the given loanId is not PENDING",
      });
    }

    // Calculate repayment amount
    const repaymentAmount = Number(
      (findLoan.amount / findLoan.term).toFixed(2)
    );
    const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;
    const repayments = [];
    let dueDate = new Date(
      findLoan.createdAt.getTime() + sevenDaysInMilliseconds
    );
    let repaySummation = 0;

    for (let i = 0; i < findLoan.term; i++) {
      const obj = {
        dueDate,
        repaymentAmount,
      };
      repaySummation += Number(repaymentAmount);
      dueDate = new Date(dueDate.getTime() + sevenDaysInMilliseconds);
      repayments.push(obj);
    }

    // Adjust the last repayment to match the total loan amount
    repayments[repayments.length - 1].repaymentAmount += Number(
      (findLoan.amount - repaySummation).toFixed(2)
    );

    // Create repayment data for the APPROVED loan
    await Repayment.create({ loanId, repayments });

    // Update the loan status to "APPROVED" in the database
    findLoan.status = "APPROVED";

    await findLoan.save();

    res.status(200).json({
      success: true,
      message: "Loan APPROVED Successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Decline a loan request
export const loanDecline = async (req, res) => {
  try {
    const { loanId } = req.body;

    // Check if loanId is missing
    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: "loanId is a required field",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Only admins can decline loans",
      });
    }

    // Find the loan associated with the given loanId
    const findLoan = await Loan.findById(loanId);

    if (!findLoan) {
      return res.status(400).json({
        success: false,
        message: "No loan associated with the given loanId",
      });
    }

    if (findLoan.status === "APPROVED" || findLoan.status === "DECLINED") {
      return res.status(400).json({
        success: false,
        message: "The loan associated with the given loanId is not PENDING",
      });
    }

    // Update the loan status to "DECLINED" in the database
    findLoan.status = "DECLINED";

    await findLoan.save();

    res.status(200).json({
      success: true,
      message: "Loan DECLINED Successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const termRepayment = async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(400).json({
        success: false,
        message: "Only users can make loan repayments",
      });
    }

    const { loanId, repaymentTerm } = req.body;

    // Check if loanId and repaymentTerm are missing
    if (!loanId || !repaymentTerm) {
      return res.status(400).json({
        success: false,
        message: "loanId and repaymentTerm are required",
      });
    }

    // Find the loan associated with the given loanId
    const findLoan = await Loan.findById(loanId);

    if (!findLoan) {
      return res.status(400).json({
        success: false,
        message: "No loan is associated with the provided loanId",
      });
    }

    // Check if the user is the owner of the loan
    if (req.user._id.toString() !== findLoan.userId.toString()) {
      return res.status(400).json({
        success: false,
        message:
          "This loan is not associated with you, so you can't make payments for it",
      });
    }

    const findRepay = await Repayment.findOne({ loanId });

    if (repaymentTerm < 1 || repaymentTerm > findRepay.repayments.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid repaymentTerm for the given loan",
      });
    }

    const termIndex = repaymentTerm - 1;

    // Check if the repayment for the term has already been paid
    if (findRepay.repayments[termIndex].status !== "PAY") {
      return res.status(400).json({
        success: false,
        message: `Repayment for term number ${repaymentTerm} has already been paid for the given loan`,
      });
    }

    // Update the status of the repayment to "PAID"
    findRepay.repayments[termIndex].status = "PAID";
    await findRepay.save();

    // Check if the loan is completely paid
    if (findLoan.remainingTerm === 1) {
      findLoan.status = "PAID";
    }

    // Update the remaining term of the loan
    findLoan.remainingTerm = findLoan.remainingTerm - 1;
    await findLoan.save();

    // Send a successful response to the frontend
    res.status(200).json({
      success: true,
      message: `Repayment done for term number ${repaymentTerm}`,
    });
  } catch (err) {
    // Handle any errors that occur
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//route to find the  mine pending loan request
export const findPendingLoans = async (req, res) => {
  try {
    // Check if the user is an admin
    if (req.user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Only users can access this route",
      });
    }

    const pending = await Loan.find({
      userId: req.user._id,
      status: "PENDING",
    });

    // Send a successful response with pending loans
    return res.status(200).json({
      success: true,
      pending,
    });
  } catch (err) {
    // Handle any errors that occur
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//route to find the all pending loan request

export const getAllPendingLoans = async (req, res) => {
  if (req.user.role === "user") {
    return res.status(400).json({
      success: false,
      message: "You are a user, and this route is only accessible for admins",
    });
  }

  try {
    const pending = await Loan.find({ status: "PENDING" });

    res.status(200).json({
      success: true,
      pending,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching pending loans",
    });
  }
};

//route to find the approved loan request
export const getApprovedLoans = async (req, res) => {
  if (req.user.role === "admin") {
    return res.status(400).json({
      success: false,
      message: "Admin can't access this route",
    });
  }

  try {
    const approved = await Loan.find({
      userId: req.user._id,
      status: "APPROVED",
    });

    res.status(200).json({
      success: true,
      approved,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching approved loans",
    });
  }
};

//route to find the declined loan request

export const getDeclinedLoans = async (req, res) => {
  if (req.user.role === "admin") {
    return res.status(400).json({
      success: false,
      message: "Admin can't access this route",
    });
  }

  try {
    const declined = await Loan.find({
      userId: req.user._id,
      status: "DECLINED",
    });

    res.status(200).json({
      success: true,
      declined,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching declined loans",
    });
  }
};

//route to find the paid loan request

export const getPaidLoans = async (req, res) => {
  if (req.user.role === "admin") {
    return res.status(400).json({
      success: false,
      message: "Admin can't access this route",
    });
  }

  try {
    const paid = await Loan.find({ userId: req.user._id, status: "PAID" });

    res.status(200).json({
      success: true,
      paid,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching paid loans",
    });
  }
};
//route to find the repayment terms for a loan

export const getLoanRepayments = async (req, res) => {
  if (req.user.role === "admin") {
    return res.status(400).json({
      success: false,
      message: "Admin can't access this route",
    });
  }

  const loanId = req.params.loanId;

  if (!loanId) {
    return res.status(400).json({
      success: false,
      message: "loanId is required",
    });
  }

  try {
    const repay = await Repayment.findOne({ loanId });

    if (!repay) {
      return res.status(404).json({
        success: false,
        message: "Repayments not found for this loanId",
      });
    }

    res.status(200).json({
      success: true,
      repayments: repay.repayments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching loan repayments",
    });
  }
};
