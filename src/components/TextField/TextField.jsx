import React, { useState } from "react";
import "./TextField.css";




const TextField = ({ name, value, onChange, type = "text", placeholder }) => {
  return (
    <input
      className="textfield"
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
};
export default TextField;