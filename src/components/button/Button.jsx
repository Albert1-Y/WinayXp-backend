import React from "react";
import "./Button.css";
import PropTypes from "prop-types";

const Button = ({ text, styleType, onClick, disabled, icon }) => {
  // Función para generar las iniciales del texto
  const generateInitials = (text) => {
    if (!text) return "";

    // Dividir el texto por espacios
    const words = text.split(" ");

    // Si es una sola palabra, devolver la primera letra
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    // Si son múltiples palabras, devolver las iniciales
    return words.map(word => word.charAt(0).toUpperCase()).join("");
  };

  const initials = generateInitials(text);

  return (
    <button
      className={`button ${styleType || ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="button-icon">{icon}</span>}
      <span className="button-text">{text}</span>
      <span className="button-initials">{initials}</span>
    </button>
  );
};

Button.propTypes = {
  text: PropTypes.string.isRequired,
  styleType: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
};

export default Button;



