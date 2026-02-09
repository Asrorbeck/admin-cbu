# Frontend Qo'llanma: Yakuniy Suhbat Funksiyasi

## 📋 Umumiy Ma'lumot

Bu qo'llanma "Umumiy natijalar" bo'limida yakuniy suhbat uchun bildirishnoma yuborish funksiyasini frontend'da qanday integratsiya qilishni tushuntiradi.

**⚠️ MUHIM:** Online va offline suhbatlar uchun **alohida sana va vaqt** belgilash mumkin. Ikkala tur uchun ham belgilash mumkin yoki faqat birini tanlash mumkin.

## 🔗 API Endpointlar

### 1. Umumiy Natijalar Ro'yxatini Olish

**Endpoint:** `GET /api/v1/attempts/general-results/`

**Tavsif:** Test va til suhbatidan o'tgan nomzodlar ro'yxatini qaytaradi.

**Query Parameters:**
- `end_time` (optional, string): Test yakunlangan sana (YYYY-MM-DD formatida)
- `page` (optional, number): Sahifa raqami (default: 1)
- `page_size` (optional, number): Har sahifadagi elementlar soni (default: 20, max: 100)

**Request Misoli:**
```javascript
// Axios misoli
const response = await axios.get('/api/v1/attempts/general-results/', {
  params: {
    end_time: '2025-01-15',  // Ixtiyoriy - ma'lum sanadagi natijalar
    page: 1,
    page_size: 10
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Response Strukturasi:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 123,
      "chat": {
        "user_id": 905770018,
        "username": "Asrorbek_10",
        "full_name": "Tursunpulatov Asrorbek Toyli ogli",
        "phone_number": "+998901234567"
      },
      "test": {
        "id": 2,
        "title": "1-toifa uchun test",
        "total_questions": 10,
        "pass_score": 70,
        "max_violations": 5
      },
      "application": {
        "id": 123,
        "jshshir": "12345678901234",
        "full_name": "Tursunpulatov Asrorbek Toyli ogli",
        "status": "TEST_COMPLETED",
        "vacancy": {
          "id": 5,
          "title_uz": "Senior Developer",
          "lan_requirements_ru": "B2",
          "lan_requirements_eng": "C1"
        }
      },
      "status": "COMPLETED",
      "status_display": "Yakunlandi",
      "score": 85,
      "is_passed": true,
      "overall_result": true,
      "actual_russian_level": "B1",
      "actual_english_level": "B2",
      "final_interview_online_date": null,
      "final_interview_online_time": null,
      "final_interview_online_meet_link": null,
      "final_interview_offline_date": null,
      "final_interview_offline_time": null,
      "final_interview_status": null,
      "final_interview_candidate_choice": null
    }
  ]
}
```

---

### 2. Yakuniy Suhbat Uchun Bildirishnoma Yuborish

**Endpoint:** `POST /api/v1/attempts/send-final-interview-invite/`

**Tavsif:** Tanlangan nomzodlarga yakuniy suhbat taklifi yuboradi. Online va offline suhbatlar uchun alohida sana va vaqt belgilash mumkin. Barcha nomzodlarga Telegram orqali xabar ketadi va ular online/offline tanlash imkoniyatiga ega bo'ladi.

**Request Body:**
```json
{
  "attempt_ids": [123, 124, 125],
  "online_interview_date": "2025-01-20",  // Online suhbat sanasi (YYYY-MM-DD) - ixtiyoriy
  "online_interview_time": "14:00",  // Online suhbat vaqti (HH:MM) - ixtiyoriy
  "online_meet_link": "https://meet.google.com/xyz-abc-def",  // Google Meet havolasi (online uchun) - ixtiyoriy
  "offline_interview_date": "2025-01-21",  // Offline suhbat sanasi (YYYY-MM-DD) - ixtiyoriy
  "offline_interview_time": "15:00"  // Offline suhbat vaqti (HH:MM) - ixtiyoriy
}
```

**Validation Qoidalari:**
- `attempt_ids`: Array, kamida 1 ta ID bo'lishi kerak
- **Kamida bitta suhbat turi** (online yoki offline) uchun sana va vaqt belgilanishi kerak
- `online_interview_date` va `online_interview_time`: Online suhbat uchun (ixtiyoriy, lekin ikkalasi ham bo'lishi kerak)
- `offline_interview_date` va `offline_interview_time`: Offline suhbat uchun (ixtiyoriy, lekin ikkalasi ham bo'lishi kerak)
- `online_meet_link`: Online suhbat uchun **MAJBURIY** (agar online belgilangan bo'lsa)
- Har ikkala sana ham kelajakda bo'lishi kerak

**Request Misoli:**
```javascript
// Faqat online suhbat
const response = await axios.post(
  '/api/v1/attempts/send-final-interview-invite/',
  {
    attempt_ids: [123, 124, 125],
    online_interview_date: '2025-01-20',
    online_interview_time: '14:00',
    online_meet_link: 'https://meet.google.com/xyz-abc-def'
  },
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

// Faqat offline suhbat
const response = await axios.post(
  '/api/v1/attempts/send-final-interview-invite/',
  {
    attempt_ids: [123, 124, 125],
    offline_interview_date: '2025-01-21',
    offline_interview_time: '15:00'
  },
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

// Ikkala tur ham
const response = await axios.post(
  '/api/v1/attempts/send-final-interview-invite/',
  {
    attempt_ids: [123, 124, 125],
    online_interview_date: '2025-01-20',
    online_interview_time: '14:00',
    online_meet_link: 'https://meet.google.com/xyz-abc-def',
    offline_interview_date: '2025-01-21',
    offline_interview_time: '15:00'
  },
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Response (Muvaffaqiyatli):**
```json
{
  "success": true,
  "message": "3 ta nomzodga yakuniy suhbat taklifi yuborildi",
  "updated_count": 3,
  "sent_count": 3,
  "failed_count": 0
}
```

**Response (Qisman muvaffaqiyatli):**
```json
{
  "success": true,
  "message": "2 ta nomzodga yakuniy suhbat taklifi yuborildi",
  "updated_count": 3,
  "sent_count": 2,
  "failed_count": 1,
  "failed_attempts": [
    {
      "attempt_id": 125,
      "user_id": 123456789,
      "error": "Xabar yuborilmadi"
    }
  ]
}
```

**Xatolik Response (400 Bad Request):**
```json
{
  "attempt_ids": ["Ba'zi attempt ID'lar noto'g'ri yoki test va til suhbatidan o'tmagan nomzodlar"]
}
```

yoki

```json
{
  "non_field_errors": ["Kamida bitta suhbat turi (online yoki offline) uchun sana va vaqt belgilanishi kerak"]
}
```

yoki

```json
{
  "online_meet_link": ["Online suhbat uchun Google Meet havolasi majburiy"]
}
```

yoki

```json
{
  "online_interview_date": ["Online suhbat sanasi kelajakda bo'lishi kerak"]
}
```

yoki

```json
{
  "offline_interview_date": ["Offline suhbat sanasi kelajakda bo'lishi kerak"]
}
```

---

## 🎨 Frontend Implementatsiya

### 1. Umumiy Natijalar Komponenti

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GeneralResults = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    page_size: 10
  });

  // Nomzodlarni yuklash
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        page_size: pagination.page_size
      };
      
      if (selectedDate) {
        params.end_time = selectedDate;
      }

      const response = await axios.get('/api/v1/attempts/general-results/', {
        params,
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      setCandidates(response.data.results);
      setPagination(prev => ({
        ...prev,
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous
      }));
    } catch (error) {
      console.error('Xatolik:', error);
      alert('Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedDate, pagination.page, pagination.page_size]);

  // Checkbox tanlash
  const handleSelectCandidate = (attemptId) => {
    setSelectedCandidates(prev => {
      if (prev.includes(attemptId)) {
        return prev.filter(id => id !== attemptId);
      } else {
        return [...prev, attemptId];
      }
    });
  };

  // Barchasini tanlash
  const handleSelectAll = () => {
    if (selectedCandidates.length === candidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(candidates.map(c => c.id));
    }
  };

  // Modal ochish
  const handleOpenModal = () => {
    if (selectedCandidates.length === 0) {
      alert('Iltimos, kamida bitta nomzodni tanlang');
      return;
    }
    setShowModal(true);
  };

  return (
    <div className="general-results">
      <h2>Umumiy natijalar</h2>
      <p>Test va til suhbatidan o'tgan foydalanuvchilar ro'yxati</p>

      {/* Filtrlash */}
      <div className="filters">
        <label>
          Sana:
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
      </div>

      {/* Jadval */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedCandidates.length === candidates.length && candidates.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>FIO</th>
              <th>Vakansiya</th>
              <th>Test natijasi</th>
              <th>Rus tili</th>
              <th>Ingliz tili</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7">Yuklanmoqda...</td>
              </tr>
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan="7">Natijalar yo'q</td>
              </tr>
            ) : (
              candidates.map(candidate => (
                <tr key={candidate.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(candidate.id)}
                      onChange={() => handleSelectCandidate(candidate.id)}
                    />
                  </td>
                  <td>{candidate.chat?.full_name || candidate.application?.full_name}</td>
                  <td>{candidate.application?.vacancy?.title_uz}</td>
                  <td>{candidate.score}%</td>
                  <td>{candidate.actual_russian_level || '-'}</td>
                  <td>{candidate.actual_english_level || '-'}</td>
                  <td>
                    {candidate.final_interview_status 
                      ? getStatusDisplay(candidate.final_interview_status)
                      : 'Taklif yuborilmagan'
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={!pagination.previous}
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
        >
          Oldingi
        </button>
        <span>
          Sahifa {pagination.page} / {Math.ceil(pagination.count / pagination.page_size)}
        </span>
        <button
          disabled={!pagination.next}
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
        >
          Keyingi
        </button>
      </div>

      {/* Tugmalar */}
      <div className="actions">
        <button
          className="btn-primary"
          onClick={handleOpenModal}
          disabled={selectedCandidates.length === 0}
        >
          🔔 Bildirishnoma yuborish ({selectedCandidates.length})
        </button>
        <button className="btn-secondary">
          📊 Excel yuklab olish
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <FinalInterviewModal
          attemptIds={selectedCandidates}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setSelectedCandidates([]);
            fetchCandidates();
          }}
        />
      )}
    </div>
  );
};

// Status ko'rsatish funksiyasi
const getStatusDisplay = (status) => {
  const statusMap = {
    'pending': 'Kutilmoqda',
    'invited': 'Taklif qilindi',
    'online_selected': 'Online tanlandi',
    'offline_selected': 'Offline tanlandi',
    'completed': 'Yakunlandi',
    'no_show': 'Kelmagan',
    'cancelled': 'Bekor qilindi'
  };
  return statusMap[status] || status;
};

export default GeneralResults;
```

---

### 2. Modal Komponenti (Yakuniy Suhbat Taklifi)

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const FinalInterviewModal = ({ attemptIds, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    // Online suhbat
    online_interview_date: '',
    online_interview_time: '',
    online_meet_link: '',
    // Offline suhbat
    offline_interview_date: '',
    offline_interview_time: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form o'zgarishlari
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Xatoliklarni tozalash
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Form yuborish
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validatsiya
    const newErrors = {};
    
    // Online suhbat validatsiyasi
    const hasOnline = formData.online_interview_date && formData.online_interview_time;
    if (hasOnline) {
      if (!formData.online_meet_link) {
        newErrors.online_meet_link = 'Online suhbat uchun Google Meet havolasi majburiy';
      }
      
      const onlineDate = new Date(formData.online_interview_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (onlineDate < today) {
        newErrors.online_interview_date = 'Online suhbat sanasi kelajakda bo\'lishi kerak';
      }
    }
    
    // Offline suhbat validatsiyasi
    const hasOffline = formData.offline_interview_date && formData.offline_interview_time;
    if (hasOffline) {
      const offlineDate = new Date(formData.offline_interview_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (offlineDate < today) {
        newErrors.offline_interview_date = 'Offline suhbat sanasi kelajakda bo\'lishi kerak';
      }
    }
    
    // Kamida bitta suhbat turi bo'lishi kerak
    if (!hasOnline && !hasOffline) {
      newErrors.non_field_errors = 'Kamida bitta suhbat turi (online yoki offline) uchun sana va vaqt belgilanishi kerak';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const requestData = {
        attempt_ids: attemptIds
      };

      // Online suhbat ma'lumotlarini qo'shish
      if (hasOnline) {
        requestData.online_interview_date = formData.online_interview_date;
        requestData.online_interview_time = formData.online_interview_time;
        requestData.online_meet_link = formData.online_meet_link;
      }
      
      // Offline suhbat ma'lumotlarini qo'shish
      if (hasOffline) {
        requestData.offline_interview_date = formData.offline_interview_date;
        requestData.offline_interview_time = formData.offline_interview_time;
      }

      const response = await axios.post(
        '/api/v1/attempts/send-final-interview-invite/',
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        
        // Qisman muvaffaqiyatli bo'lsa, xatolarni ko'rsatish
        if (response.data.failed_count > 0) {
          console.warn('Qisman muvaffaqiyatli:', response.data.failed_attempts);
        }
        
        onSuccess();
      }
    } catch (error) {
      console.error('Xatolik:', error);
      
      // Backend validatsiya xatolarini ko'rsatish
      if (error.response?.data) {
        const backendErrors = error.response.data;
        setErrors(backendErrors);
        
        // Umumiy xabar
        const errorMessages = Object.values(backendErrors).flat();
        alert(`Xatolik: ${errorMessages.join(', ')}`);
      } else {
        alert('Xatolik: Xabar yuborishda muammo yuz berdi');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Yakuniy suhbat uchun bildirishnoma yuborish</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {errors.non_field_errors && (
            <div className="error-message" style={{ marginBottom: '15px', color: 'red' }}>
              {errors.non_field_errors}
            </div>
          )}

          {/* Online Suhbat */}
          <div className="form-section">
            <h4>🌐 Online Suhbat (Ixtiyoriy)</h4>
            
            <div className="form-group">
              <label>
                Online suhbat sanasi:
              </label>
              <input
                type="date"
                name="online_interview_date"
                value={formData.online_interview_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={errors.online_interview_date ? 'error' : ''}
              />
              {errors.online_interview_date && (
                <span className="error-message">{errors.online_interview_date}</span>
              )}
            </div>

            <div className="form-group">
              <label>
                Online suhbat vaqti:
              </label>
              <input
                type="time"
                name="online_interview_time"
                value={formData.online_interview_time}
                onChange={handleChange}
                className={errors.online_interview_time ? 'error' : ''}
              />
              {errors.online_interview_time && (
                <span className="error-message">{errors.online_interview_time}</span>
              )}
            </div>

            <div className="form-group">
              <label>
                Google Meet havolasi:
              </label>
              <input
                type="url"
                name="online_meet_link"
                value={formData.online_meet_link}
                onChange={handleChange}
                placeholder="https://meet.google.com/xyz-abc-def"
                className={errors.online_meet_link ? 'error' : ''}
              />
              {errors.online_meet_link && (
                <span className="error-message">{errors.online_meet_link}</span>
              )}
            </div>
          </div>

          {/* Offline Suhbat */}
          <div className="form-section" style={{ marginTop: '30px' }}>
            <h4>🏢 Offline Suhbat (Ixtiyoriy)</h4>
            
            <div className="form-group">
              <label>
                Offline suhbat sanasi:
              </label>
              <input
                type="date"
                name="offline_interview_date"
                value={formData.offline_interview_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={errors.offline_interview_date ? 'error' : ''}
              />
              {errors.offline_interview_date && (
                <span className="error-message">{errors.offline_interview_date}</span>
              )}
            </div>

            <div className="form-group">
              <label>
                Offline suhbat vaqti:
              </label>
              <input
                type="time"
                name="offline_interview_time"
                value={formData.offline_interview_time}
                onChange={handleChange}
                className={errors.offline_interview_time ? 'error' : ''}
              />
              {errors.offline_interview_time && (
                <span className="error-message">{errors.offline_interview_time}</span>
              )}
            </div>
          </div>

          <div className="info-box" style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
            <small>
              💡 <b>Eslatma:</b> Kamida bitta suhbat turi (online yoki offline) uchun sana va vaqt belgilanishi kerak. 
              Ikkala tur uchun ham belgilash mumkin.
            </small>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Yuborilmoqda...' : 'Yuborish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Token olish funksiyasi (sizning auth tizimingizga qarab)
const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export default FinalInterviewModal;
```

---

### 3. CSS Stil (Ixtiyoriy)

```css
.general-results {
  padding: 20px;
}

.filters {
  margin-bottom: 20px;
  display: flex;
  gap: 15px;
  align-items: center;
}

.filters label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table th,
table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary {
  background-color: #ff6b35;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-section {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #fafafa;
}

.form-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.required {
  color: red;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

input[type="text"],
input[type="date"],
input[type="time"],
input[type="url"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

input.error {
  border-color: red;
}

.error-message {
  color: red;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}
```

---

## 📝 Muhim Eslatmalar

1. **Authentication**: Barcha so'rovlarda `Authorization` header'ida token yuborish kerak.

2. **Validatsiya**: 
   - **Kamida bitta suhbat turi** (online yoki offline) uchun sana va vaqt belgilanishi kerak
   - Online suhbat uchun: sana, vaqt va Google Meet havolasi majburiy (agar online belgilangan bo'lsa)
   - Offline suhbat uchun: faqat sana va vaqt (havola kerak emas)
   - Har ikkala sana ham kelajakda bo'lishi kerak
   - Online va offline uchun har xil sana va vaqt belgilash mumkin

3. **Error Handling**: Backend validatsiya xatolarini to'g'ri ko'rsatish kerak.

4. **Loading States**: Yuborish jarayonida loading holatini ko'rsatish kerak.

5. **Success Feedback**: Muvaffaqiyatli yuborilgandan keyin foydalanuvchiga xabar ko'rsatish kerak.

6. **Pagination**: Katta ro'yxatlar uchun pagination ishlatish tavsiya etiladi.

---

## 🔄 Ishlash Jarayoni

1. **Moderator** "Umumiy natijalar" bo'limiga kiradi
2. **Sana bo'yicha filtrlash** (ixtiyoriy)
3. **Nomzodlarni tanlash** (checkbox orqali)
4. **"Bildirishnoma yuborish"** tugmasini bosadi
5. **Modal oyna** ochiladi:
   - **Online suhbat bo'limi** (ixtiyoriy):
     - Online suhbat sanasi
     - Online suhbat vaqti
     - Google Meet havolasi
   - **Offline suhbat bo'limi** (ixtiyoriy):
     - Offline suhbat sanasi
     - Offline suhbat vaqti
   - **Eslatma:** Kamida bitta suhbat turi uchun sana va vaqt belgilanishi kerak
6. **"Yuborish"** tugmasini bosadi
7. **Backend** barcha tanlangan nomzodlarga Telegram orqali xabar yuboradi
8. **Nomzodlar** Telegram'da online/offline tanlash imkoniyatiga ega bo'ladi
9. **Tanlov** qilingandan keyin, nomzodga suhbat ma'lumotlari yuboriladi

---

## 🧪 Test Qilish

1. **Umumiy natijalar ro'yxatini olish:**
   ```bash
   GET /api/v1/attempts/general-results/?end_time=2025-01-15&page=1&page_size=10
   ```

2. **Yakuniy suhbat taklifi yuborish (faqat online):**
   ```bash
   POST /api/v1/attempts/send-final-interview-invite/
   {
     "attempt_ids": [123, 124],
     "online_interview_date": "2025-01-20",
     "online_interview_time": "14:00",
     "online_meet_link": "https://meet.google.com/xyz-abc-def"
   }
   ```

3. **Yakuniy suhbat taklifi yuborish (faqat offline):**
   ```bash
   POST /api/v1/attempts/send-final-interview-invite/
   {
     "attempt_ids": [123, 124],
     "offline_interview_date": "2025-01-21",
     "offline_interview_time": "15:00"
   }
   ```

4. **Yakuniy suhbat taklifi yuborish (ikkala tur ham):**
   ```bash
   POST /api/v1/attempts/send-final-interview-invite/
   {
     "attempt_ids": [123, 124],
     "online_interview_date": "2025-01-20",
     "online_interview_time": "14:00",
     "online_meet_link": "https://meet.google.com/xyz-abc-def",
     "offline_interview_date": "2025-01-21",
     "offline_interview_time": "15:00"
   }
   ```

---

## ❓ Savol-Javoblar

**Q: Agar nomzod online/offline tanlamasa nima bo'ladi?**
A: Nomzod tanlov qilguncha `final_interview_status` "invited" holatida qoladi.

**Q: Bir nomzodga bir necha marta taklif yuborish mumkinmi?**
A: Ha, mumkin. Har safar yangi ma'lumotlar bilan yuboriladi va eski ma'lumotlar yangilanadi.

**Q: Online va offline suhbatlar uchun har xil sana va vaqt belgilash mumkinmi?**
A: Ha, albatta! Online va offline suhbatlar uchun alohida sana va vaqt belgilash mumkin. Ikkala tur uchun ham belgilash mumkin yoki faqat birini tanlash mumkin.

**Q: Agar faqat online yoki faqat offline belgilansa nima bo'ladi?**
A: Nomzodlar faqat belgilangan suhbat turini tanlash imkoniyatiga ega bo'ladi. Agar ikkala tur ham belgilansa, nomzod o'z tanlovini qiladi.

**Q: Online suhbat uchun meet_link yuborilmasa nima bo'ladi?**
A: Backend validatsiya xatosi qaytaradi: "Online suhbat uchun Google Meet havolasi majburiy"

**Q: Qaysi nomzodlar ro'yxatda ko'rinadi?**
A: Faqat `is_passed=True`, `overall_result=True` va `status='COMPLETED'` bo'lgan nomzodlar.

---

## 📞 Yordam

Agar savollaringiz bo'lsa, backend developer bilan bog'laning.

