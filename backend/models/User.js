const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        trim: true,
        maxlength: [30, "Username cannot exceed 30 characters"],
        minlength: [3, "Username must be at least 3 characters"],
        lowercase: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters"],
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    passwordChangedAt: Date,
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    }
});

// Add index for frequently queried field
userSchema.index({ email: 1 });

// Add method for password change tracking (needed for auth security)
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

module.exports = mongoose.model("User", userSchema);