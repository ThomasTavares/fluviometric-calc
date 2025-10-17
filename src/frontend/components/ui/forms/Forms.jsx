const FormInput = ({ label, value, onChange, placeholder, type = "text" }) => {
    return (
        <div>
            {label && <label style={labelStyle}>{label}</label>}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={inputStyle}
            />
        </div>
    );
};