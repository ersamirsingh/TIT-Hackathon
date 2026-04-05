import validator from "validator";

export const validate = (data) => {
    try {
        if (!data) {
            throw new Error("Data not present");
        }

        const { emailId, password, contact } = data;
        const contactValue = String(contact || "").trim();

        if (!validator.isEmail(String(emailId || "").trim())) {
            throw new Error("Invalid email");
        }

        if (
            !validator.isStrongPassword(String(password || ""), {
                minLength: 8,
                minLowercase: 1,
                minUppercase: 0,
                minNumbers: 1,
                minSymbols: 0,
            })
        ) {
            throw new Error("Password must be at least 8 characters and include a number");
        }

        if (!validator.isMobilePhone(contactValue, "any")) {
            throw new Error("Invalid phone number");
        }

        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};
