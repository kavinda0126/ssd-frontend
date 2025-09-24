import React, { useEffect, useState,useContext } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../../../utils/apiService";
//import { CusAuthContext } from "../../../../context/cus-authcontext";
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Button from 'react-bootstrap/Button';
import Card from "react-bootstrap/Card";
import html2pdf from "html2pdf.js";
import { Container } from "react-bootstrap";
import logo from "../../../images/logoblack_trans.png";
import { StaffAuthContext } from "../../../context/StaffAuthContext";
import FeedbackReviewModal from "./FeedbackReviewModal";
import { createSafeElement, escapeHTML } from "../../../utils/domSanitizer";

function FeedbackReview({ toggleLoading }){
  const { userId, userPosition } = useContext(StaffAuthContext);
    //const cusauth = useContext(CusAuthContext);
    const navigate = useNavigate();
    const [Feedback, setfeedback] = useState([]);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    useEffect(() => {
        const fetchFeedbacks = async() => {
          try{
            toggleLoading(true);
            const response = await apiService.get(`/cam/feedback/get-feedbacks`);
            setfeedback(response.feedbacks);
          }catch (error) {
            console.error("Error fetching data:", error);
          }finally {
            toggleLoading(false); // Set loading to false after API call
          }
        }
        fetchFeedbacks();
    },  []);

    // Function to handle update click
  const handleUpdateClick = () => {
    //setSelectedFeedback(feedback);
    setShowUpdateModal(true);
  };

  // Function to handle update feedback
  const handleUpdateFeedback = async (updatedData) => {
    // Logic to update feedback data
    //fetchFeedbackById(Feedback.feedbackId);
    setShowUpdateModal(false); // Close the update modal
  };

    /*----Parts regarding generate pdf from employee personal details-------*/
  const generatePDF = () => {
    const element = document.querySelector(".feedbackDetails"); // Select the container to convert to PDF
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
      filename: "feedback_Details.pdf",
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
        <main>
            <div>
                <Row>
                    <Col>
            <Container className="feedbackDetails">
                    {Feedback.map((feedback, index) => (
                    <div key={index}>
                    <div className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">
                      Customer Name : {feedback.name}<br></br> 
                      Service Type : {feedback.serviceType}<br></br>
                      Specific Employee mentioned : {feedback.employee}<br/><br/>
                      FeedBack : {feedback.feedback}<br></br>
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
              <span
                    className="bi bi-file-pdf"
                    style={{ marginRight: "5px" }}
                  ></span>
            </Button>
                    </Col>
                    </Row> 
            </div>
             {/* Render the FeedbackUpdateModal when showUpdateModal is true */}
        {showUpdateModal && (
          <FeedbackReviewModal
            show={showUpdateModal}
            onHide={() => setShowUpdateModal(false)}
            //feedback={selectedFeedback}
            onUpdate={handleUpdateFeedback}
          />
        )}
        </main>
   
    
    );

}

export default FeedbackReview;