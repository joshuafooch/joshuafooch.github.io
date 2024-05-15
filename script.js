let activeTag = "all";
let tags = ["all", "deeplearning", "education", "physicssim"];

tags.forEach((tagToDisplay) => {
    document.getElementById(tagToDisplay + "-button").onclick = (e) => {
        e.target.setAttribute("class", "button-primary");
        if (tagToDisplay != activeTag) document.getElementById(activeTag + "-button").removeAttribute("class", "button-primary");
        activeTag = tagToDisplay;
        let projectsArray = [...document.getElementById("portfolio-table-body").children];
        projectsArray.forEach((project) => {
            if (tagToDisplay == "all" || project.classList.contains(tagToDisplay)) project.style.display = "table-row";
            else project.style.display = "none";
        });
    }
});
  

// // filter projects
// console.log(document.getElementsByClassName(tags[i]));
// document.getElementsByClassName(tags[i]).style.display = "block";
// for(let j=0; j<tagButtons.length; j++) {
//     if (j!=i) document.getElementsByClassName(tags[j]).style.display = "none";
// }