document.addEventListener("click", (e) =>{
    var snowflake = document.createElement("span");
    snowflake.classList.add("snowflake");

    snowflake.style.left = e.offsetX + "px";
    snowflake.style.top = e.offsetY + "px";

    var size = Math.random() * (100 - 20 + 1) + 20;

    snowflake.style.width = size + "px";
    snowflake.style.height = size + "px";

    document.body.appendChild(snowflake);

    setTimeout(() =>{
        snowflake.remove();
    }, 1000);
});