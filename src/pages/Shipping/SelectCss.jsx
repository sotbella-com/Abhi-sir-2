export const chakraLikeSelectStyles = (hasError = false) => ({
  control: (provided, state) => ({
    ...provided,
    minHeight: "40px",
    borderRadius: 0,

    // ✅ Desktop default (boxed)
    border: `1px solid ${hasError ? "#E53E3E" : "black"}`,
    borderBottom: `1px solid ${hasError ? "#E53E3E" : "black"}`,

    boxShadow: "none",
    outline: "none",
    backgroundColor: "white",
    opacity: 1,
    cursor: state.isDisabled ? "not-allowed" : "default",

    "&:hover": {
      borderColor: "black",
      boxShadow: "none",
    },

    // ✅ Mobile underline-only
    "@media (max-width: 767px)": {
      border: "none",
      borderBottom: `1px solid ${hasError ? "#E53E3E" : "black"}`,
      borderRadius: 0,
    },
  }),

  valueContainer: (provided) => ({
    ...provided,
    paddingLeft: 12,
    paddingRight: 12,
  }),

  input: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
    color: "black",
  }),

  placeholder: (provided) => ({
    ...provided,
    color: "rgba(0,0,0,0.30)",
    fontSize: "14px",
  }),

  singleValue: (provided, state) => ({
    ...provided,
    color: state.isDisabled ? "rgba(0,0,0,0.70)" : "black",
    fontSize: "14px",
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),

  dropdownIndicator: (provided) => ({
    ...provided,
    color: "black",
    "&:hover": { color: "black" },
  }),

  menu: (provided) => ({
    ...provided,
    borderRadius: 0,
    border: "1px solid black",
    boxShadow: "none",
    overflow: "hidden",
  }),

  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "rgba(0,0,0,0.05)" : "white",
    color: "black",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "rgba(0,0,0,0.08)",
    },
  }),
});


export const customStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: "0px", // Remove border-radius
    borderColor: state.isFocused ? "black" : "black", // Black border
    boxShadow: state.isFocused ? "none" : "none",
    "&:hover": {
      borderColor: "black",
    },
    paddingTop: "1px",
    paddingBottom: "1px",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0px", // Remove border-radius
    border: "1px solid black", // Dark border
    fontSize: "14px",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#f0f0f0" : "white", // Hover effect
    color: "black",
    "&:hover": {
      backgroundColor: "#e0e0e0", // Slightly darker hover color
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "14px", // Font size for selected value in input field
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: "14px", // Change placeholder font size
    // fontStyle: "italic", // Make placeholder italic
    fontFamily: "inherit",
    color: "#343a40", // Change placeholder text color
  }),
};

export const customStylesInPage = {
  control: (provided, state) => ({
    ...provided,
    fontFamily: "lato",
    color: "hsl(0, 0%, 80%)",
    fontSize: "16px",
    borderRadius: "0px", // Remove border-radius
    borderColor: state.isFocused ? "#d2d2d2" : "#d2d2d2", // Black border
    border: "1px",
    boxShadow: state.isFocused ? "0 0 0 1px #d2d2d2" : "none",
    "&:hover": {
      borderColor: "#d2d2d2",
    },
    minHeight: "50px",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0px", // Remove border-radius
    border: "1px solid #d2d2d2", // Dark border
    fontSize: "16px",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#f0f0f0" : "white", // Hover effect
    color: "#535151",
    "&:hover": {
      backgroundColor: "#e0e0e0", // Slightly darker hover color
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "14px", // Font size for selected value in input field
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: "14px", // Change placeholder font size
    // fontStyle: "italic", // Make placeholder italic
    // fontFamily: "inherit",
    fontFamily: "lato",
    //color: "#535151", // Change placeholder text color
    color: "hsl(0, 0.40%, 45.30%)",
  }),
};
