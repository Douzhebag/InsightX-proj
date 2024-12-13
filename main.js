// ฟังก์ชันจัดการ Local Storage
function getSubmissionTime() {
    return localStorage.getItem('lastSubmissionTime') || '0';
}

function setSubmissionTime(time) {
    localStorage.setItem('lastSubmissionTime', time.toString());
}

// ฟังก์ชันป้องกัน XSS
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// ค่าคงที่
const SUBMISSION_COOLDOWN = 10000; // 1 นาที

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    emailjs.init("jtGaMZB-CrxGdDMC_");
    const header = document.getElementById('header');
    const heroSection = document.getElementById('hero');
    
    const handleScroll = () => {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        
        if (window.scrollY >= heroBottom - header.offsetHeight) {
            header.classList.add('fixed');
        } else {
            header.classList.remove('fixed');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    const scrollLinks = document.querySelectorAll('.submenu .submenu-item, .sub-service, .btn-primary[aria-label="ติดต่อเรา"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.getAttribute('aria-label') === 'ติดต่อเรา') {
                const formInput = document.querySelector('.form-input');
                if (formInput) {
                    formInput.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
                return;
            }
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// ฟังก์ชันส่งอีเมล
async function sendEmail(formData) {
    try {
        const response = await emailjs.send(
            'service_xi4ebzk',
            'template_b15k8p2',
            {
                // แก้ไขให้ตรงกับ template parameters ใน EmailJS
                name: formData.name,           // เปลี่ยนจาก from_name
                email: formData.email,         // เปลี่ยนจาก from_email
                phone: formData.phone,
                message: formData.message,
                services: formData.services.join(', ')
                // ลบ to_email ออกเพราะควรตั้งค่าในเทมเพลต
            }
        );

        if (response.status === 200) {
            return true;
        } else {
            throw new Error('Failed to send email');
        }
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล'
        };
    }
}



// ฟังก์ชันตรวจสอบฟอร์ม
function validateForm(event) {
    event.preventDefault();
    
    // ตรวจสอบการส่งซ้ำในระยะเวลาที่กำหนด
    const currentTime = Date.now();
    const lastSubmissionTime = parseInt(getSubmissionTime());
    if (currentTime - lastSubmissionTime < SUBMISSION_COOLDOWN) {
        const remainingTime = Math.ceil((SUBMISSION_COOLDOWN - (currentTime - lastSubmissionTime)) / 60000);
        alert(`กรุณารอ ${remainingTime} นาทีก่อนส่งแบบฟอร์มอีกครั้ง`);
        return false;
    }
    
    // Get form elements
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const message = document.getElementById('message').value.trim();
    const checkboxes = document.querySelectorAll('input[name="service"]');
    
    // Validate required fields
    if (!name) {
        alert('กรุณากรอกชื่อ-สกุล');
        document.getElementById('name').focus();
        return false;
    }
    
    if (!email) {
        alert('กรุณากรอกอีเมล์');
        document.getElementById('email').focus();
        return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('กรุณากรอกอีเมล์ให้ถูกต้อง');
        document.getElementById('email').focus();
        return false;
    }
    
    if (!phone) {
        alert('กรุณากรอกเบอร์โทรติดต่อ');
        document.getElementById('phone').focus();
        return false;
    }
    
    // Validate phone format (เบอร์ไทย)
    const phoneRegex = /^(0[689]{1})+([0-9]{8})$/;
    const cleanPhone = phone.replace(/[- ]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
        alert('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 0812345678)');
        document.getElementById('phone').focus();
        return false;
    }
    
    // Validate checkbox selection
    let isChecked = false;
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            isChecked = true;
        }
    });
    
    if (!isChecked) {
        alert('กรุณาเลือกบริการที่คุณสนใจอย่างน้อย 1 รายการ');
        return false;
    }
    
    // ตรวจสอบข้อความสแปม
    const spamWords = ['casino', 'porn', 'xxx', 'viagra', 'loan'];
    const formContent = (name + email + message).toLowerCase();
    if (spamWords.some(word => formContent.includes(word))) {
        alert('ไม่สามารถส่งข้อความที่มีเนื้อหาไม่เหมาะสมได้');
        return false;
    }

    // If all validations pass, prepare form data
    const formData = {
        name: sanitizeInput(name),
        email: sanitizeInput(email),
        phone: sanitizeInput(phone),
        message: sanitizeInput(message),
        services: Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => sanitizeInput(cb.value))
    };
    
    // Disable submit button
    const submitButton = document.getElementById('sendForm');
    submitButton.disabled = true;
    submitButton.textContent = 'กำลังส่ง...';

    // Send email
    sendEmail(formData).then(result => {
        if (result === true) {
            alert('ส่งข้อมูลเรียบร้อยแล้ว');
            document.getElementById('contactForm').reset();
            setSubmissionTime(Date.now());
        } else {
            alert(result.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
        }
    }).catch(error => {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    }).finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = 'ส่งแบบฟอร์ม';
    });
}
