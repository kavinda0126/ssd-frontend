import React, { useState, useEffect,useContext } from 'react';
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams} from "react-router-dom";
import html2pdf from "html2pdf.js";
import logo from "../../../images/logoblack_trans.png";
import { StaffAuthContext } from "../../../context/StaffAuthContext";
import { createSafeElement, escapeHTML } from "../../../utils/domSanitizer";

import Form from 'react-bootstrap/Form'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Accordion from 'react-bootstrap/Accordion';

function FAQReview({ toggleLoading }){
  const [Issues, setIssues] = useState([]);
  const [consultation, setFetchedConsultation] = useState([]);
  const id = "661b58073ea6d30a9cf8d6e4";
  const { userId, userPosition } = useContext(StaffAuthContext);

  //get all consultations
  useEffect(() => {
    const fetchConsultations = async() => {
      try{
        toggleLoading(true);
        const response = await fetch(`${process.env.React_App_Backend_URL}/cam/consultation/get-issues`);

        if(!response.ok){
          throw new Error(`HTTP error! Status:${response.status}`);
        }
        const data = await response.json();
        setIssues(data.consultations);
      }catch (error) {
        console.error("Error fetching data:", error);
      }finally {
        toggleLoading(false); // Set loading to false after API call
      }
    }
    fetchConsultations();
},  []);

//destructure Feedback object
const {
  _id,
  vehicleType,
  component,
  issue,
  solution,
  files,
  filesUrls,
  _v,
} = consultation

   /*----Parts regarding generate pdf from employee personal details-------*/
   const generatePDF = () => {
    const element = document.querySelector(".faqDetails"); // Select the container to convert to PDF
    if (!element) {
      console.error("Container element not found");
      return;
    }

      // Create wrapper div to contain both header, employee list, and footer
    const wrapper = document.createElement("div");
    
    // Create header content using safe DOM methods
    const headerDiv = createSafeElement("div");
    
    // Create Customer Affairs title
    const caTitle = createSafeElement("h4", "Customer Affairs", { 
      class: "float-end font-size-15" 
    });
    headerDiv.appendChild(caTitle);
    
    // Create logo container
    const logoContainer = createSafeElement("div", "", { class: "mb-4" });
    const logoImg = createSafeElement("img", "", { 
      src: logo, 
      alt: "Invoice Logo", 
      width: "200px" 
    });
    logoContainer.appendChild(logoImg);
    headerDiv.appendChild(logoContainer);
    
    // Create contact info container
    const contactDiv = createSafeElement("div", "", { class: "text-muted" });
    
    const addressP = createSafeElement("p", "", { class: "mb-1" });
    const addressIcon = createSafeElement("i", "", { class: "bi bi-geo-alt-fill" });
    addressP.appendChild(addressIcon);
    addressP.appendChild(document.createTextNode("323/1/A Main Street Battaramulla"));
    contactDiv.appendChild(addressP);
    
    const emailP = createSafeElement("p", "", { class: "mb-1" });
    const emailIcon = createSafeElement("i", "", { class: "bi bi-envelope-fill me-1" });
    emailP.appendChild(emailIcon);
    emailP.appendChild(document.createTextNode(" info@neotech.com"));
    contactDiv.appendChild(emailP);
    
    const phoneP = createSafeElement("p", "");
    const phoneIcon = createSafeElement("i", "", { class: "bi bi-telephone-fill me-1" });
    phoneP.appendChild(phoneIcon);
    phoneP.appendChild(document.createTextNode(" 0112887998"));
    contactDiv.appendChild(phoneP);
    
    // Add authorization info
    const authorizedP = createSafeElement("p", `Authorized By: ${escapeHTML(userPosition || 'N/A')}`);
    const dateP = createSafeElement("p", `Generated Date: ${escapeHTML(new Date().toLocaleDateString())}`);
    contactDiv.appendChild(authorizedP);
    contactDiv.appendChild(dateP);
    
    headerDiv.appendChild(contactDiv);
    
    // Add horizontal rule
    const hr = createSafeElement("hr");
    headerDiv.appendChild(hr);
    
    wrapper.appendChild(headerDiv);
    wrapper.appendChild(element.cloneNode(true));

    const opt = {
      margin: 0.5,
      filename: "faq_Details.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf()
    .from(wrapper)
    .set(opt)
    .save(); // Generate and save the PDF
  };

    return(
        <>
         <div>
                <Row>
                    <Col>
            <Container className="faqDetails">
                    {Issues.map((consultation, index) => (
                    <div key={index}>
                    <div className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title"> 
                      Customer Name : {consultation.name}<br></br>
                      Vehicle Type : {consultation.vehicleType}<br></br>
                      Component : {consultation.component}<br></br>
                      Issue : {consultation.issue}<br></br>
                      Solution : {consultation.solution}
                      </h5>
                    </div>
                    </div>
                    </div>
                    ))}
                     </Container>
                     <Button
              variant="primary"
              onClick={generatePDF}
              style={{ margin: "10px" }}
            >
              Generate PDF
            </Button>
                    </Col>
                    </Row> 
            </div>
         </>
    );

}

export default FAQReview;