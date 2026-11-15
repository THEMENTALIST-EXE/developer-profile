import { useEffect, useState, useMemo, useCallback } from 'react';

// Determine the API base URL (configurable via VITE_API_BASE_URL)
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const SAMPLE_DEPARTMENTS = ['AIML', 'CSE', 'ECE', 'ISE', 'Mech'];

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // for global statistics
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState(null);
  const [notification, setNotification] = useState(null);
  const [generalError, setGeneralError] = useState('');

  // Department filter state
  const [departmentQuery, setDepartmentQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Form states for Add Student
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newSemester, setNewSemester] = useState('1');
  const [formError, setFormError] = useState('');

  // Modal states for Edit Student
  const [editingStudent, setEditingStudent] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editSemester, setEditSemester] = useState(1);
  const [editError, setEditError] = useState('');

  // Modal states for Delete Student
  const [deletingStudent, setDeletingStudent] = useState(null);

  // Active documentation tab / copied state
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Show notification with auto-dismiss
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

  // Fetch all students (and update global stats)
  const fetchAllStudents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/students`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data || [];
      setAllStudents(list);
      setApiOnline(true);
      return list;
    } catch (err) {
      setApiOnline(false);
      throw err;
    }
  }, []);

  // Fetch current view of students (all or filtered by department)
  const fetchStudents = useCallback(
    async (dept = '') => {
      setLoading(true);
      setGeneralError('');
      try {
        const url = dept
          ? `${API_BASE_URL}/students?department=${encodeURIComponent(dept)}`
          : `${API_BASE_URL}/students`;

        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to fetch students (${res.status})`);
        }
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setStudents(list);
        setApiOnline(true);

        // Also refresh global records if not filtering
        if (!dept) {
          setAllStudents(list);
        } else {
          // Refresh global in background so statistics remain accurate
          fetchAllStudents().catch(() => {});
        }
      } catch (err) {
        setGeneralError(
          err.message.includes('Failed to fetch') || err.message.includes('NetworkError')
            ? 'Cannot connect to Express REST API server. Please ensure the backend is running.'
            : err.message
        );
        setApiOnline(false);
      } finally {
        setLoading(false);
      }
    },
    [fetchAllStudents]
  );

  // Initial load
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Derived Statistics from allStudents
  const stats = useMemo(() => {
    const total = allStudents.length;
    const uniqueDepts = new Set(allStudents.map((s) => s.department?.toUpperCase()).filter(Boolean));
    const semCounts = {};
    allStudents.forEach((s) => {
      semCounts[s.semester] = (semCounts[s.semester] || 0) + 1;
    });

    let topSem = null;
    let maxCount = 0;
    Object.entries(semCounts).forEach(([sem, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topSem = sem;
      }
    });

    return {
      total,
      deptCount: uniqueDepts.size,
      topSemester: topSem ? `Sem ${topSem} (${maxCount})` : 'N/A'
    };
  }, [allStudents]);

  // Handle department search filter submission
  const handleSearch = (e) => {
    e.preventDefault();
    const query = departmentQuery.trim();
    setActiveFilter(query);
    fetchStudents(query);
  };

  // Reset department filter
  const handleResetFilter = () => {
    setDepartmentQuery('');
    setActiveFilter('');
    fetchStudents('');
  };

  // Quick department filter click
  const handleQuickFilter = (dept) => {
    if (activeFilter.toUpperCase() === dept.toUpperCase()) {
      handleResetFilter();
    } else {
      setDepartmentQuery(dept);
      setActiveFilter(dept);
      fetchStudents(dept);
    }
  };

  // Handle Add Student (POST /students)
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setFormError('');

    const idNum = parseInt(newId, 10);
    const trimmedName = newName.trim();
    const trimmedDept = newDept.trim();
    const semNum = parseInt(newSemester, 10);

    // Frontend validations
    if (!newId || isNaN(idNum) || idNum <= 0) {
      setFormError('Please enter a valid positive integer for ID.');
      return;
    }
    if (!trimmedName) {
      setFormError('Student name is required.');
      return;
    }
    if (!trimmedDept) {
      setFormError('Department is required.');
      return;
    }
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
      setFormError('Semester must be an integer between 1 and 8.');
      return;
    }

    // Duplicate check client-side
    if (allStudents.some((s) => s.id === idNum)) {
      setFormError(`Student ID ${idNum} is already assigned. Please use a unique ID.`);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: idNum,
          name: trimmedName,
          department: trimmedDept,
          semester: semNum
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Server responded with ${res.status}`);
      }

      showNotification('success', `Student "${trimmedName}" (ID: ${idNum}) added successfully!`);
      // Reset form
      setNewId('');
      setNewName('');
      setNewDept('');
      setNewSemester('1');
      setFormError('');

      // Refresh records
      await fetchStudents(activeFilter);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Dialog
  const openEditModal = (student) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditDept(student.department);
    setEditSemester(student.semester);
    setEditError('');
  };

  // Handle Update Student (PUT /students/:id)
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditError('');

    const trimmedName = editName.trim();
    const trimmedDept = editDept.trim();
    const semNum = parseInt(editSemester, 10);

    if (!trimmedName) {
      setEditError('Student name cannot be empty.');
      return;
    }
    if (!trimmedDept) {
      setEditError('Department cannot be empty.');
      return;
    }
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
      setEditError('Semester must be between 1 and 8.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          department: trimmedDept,
          semester: semNum
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Update failed with status ${res.status}`);
      }

      showNotification('success', `Student ID ${editingStudent.id} updated successfully!`);
      setEditingStudent(null);
      await fetchStudents(activeFilter);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Confirmation
  const openDeleteModal = (student) => {
    setDeletingStudent(student);
  };

  // Handle Delete Student (DELETE /students/:id)
  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/students/${deletingStudent.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Delete failed with status ${res.status}`);
      }

      showNotification('success', `Student "${deletingStudent.name}" (ID: ${deletingStudent.id}) was deleted.`);
      setDeletingStudent(null);
      await fetchStudents(activeFilter);
    } catch (err) {
      showNotification('error', `Failed to delete student: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Copy code helper for API documentation snippets
  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  // API endpoints documentation data
  const apiEndpoints = [
    {
      method: 'GET',
      route: '/students',
      summary: 'Retrieve all students',
      badgeClass: 'badge-get',
      description: 'Fetches the complete array of student records from the in-memory store.',
      exampleResponse: `{\n  "success": true,\n  "count": 6,\n  "data": [\n    { "id": 101, "name": "J Nishanth Bhat", "department": "AIML", "semester": 6 }\n  ]\n}`
    },
    {
      method: 'GET',
      route: '/students/:id',
      summary: 'Retrieve student by ID',
      badgeClass: 'badge-get',
      description: 'Returns a single student by positive integer ID. Returns 404 if not found or 400 if malformed.',
      exampleResponse: `{\n  "success": true,\n  "data": { "id": 101, "name": "J Nishanth Bhat", "department": "AIML", "semester": 6 }\n}`
    },
    {
      method: 'POST',
      route: '/students',
      summary: 'Create a new student',
      badgeClass: 'badge-post',
      description: 'Adds a new student. Enforces unique ID, non-empty name/department, and semester 1-8.',
      exampleBody: `{\n  "id": 107,\n  "name": "Aditi Rao",\n  "department": "ISE",\n  "semester": 3\n}`,
      exampleResponse: `{\n  "success": true,\n  "message": "Student created successfully.",\n  "data": { "id": 107, "name": "Aditi Rao", "department": "ISE", "semester": 3 }\n}`
    },
    {
      method: 'PUT',
      route: '/students/:id',
      summary: 'Update student details',
      badgeClass: 'badge-put',
      description: 'Updates name, department, or semester for an existing student. Preserves the original ID.',
      exampleBody: `{\n  "name": "J Nishanth Bhat",\n  "department": "AIML",\n  "semester": 7\n}`,
      exampleResponse: `{\n  "success": true,\n  "message": "Student updated successfully.",\n  "data": { "id": 101, "name": "J Nishanth Bhat", "department": "AIML", "semester": 7 }\n}`
    },
    {
      method: 'DELETE',
      route: '/students/:id',
      summary: 'Delete student by ID',
      badgeClass: 'badge-delete',
      description: 'Removes student with the matching ID from the array. Returns 200 with deleted student data.',
      exampleResponse: `{\n  "success": true,\n  "message": "Student with ID 102 deleted successfully.",\n  "data": { "id": 102, "name": "Ananya Rao", "department": "CSE", "semester": 6 }\n}`
    },
    {
      method: 'GET',
      route: '/students?department=AIML',
      summary: 'Bonus: Filter by department',
      badgeClass: 'badge-bonus',
      description: 'Performs case-insensitive department filtering on the backend array.',
      exampleResponse: `{\n  "success": true,\n  "filter": { "department": "AIML" },\n  "count": 2,\n  "data": [\n    { "id": 101, "name": "J Nishanth Bhat", "department": "AIML", "semester": 6 },\n    { "id": 103, "name": "Karthik Shenoy", "department": "AIML", "semester": 4 }\n  ]\n}`
    }
  ];

  return (
    <section id="student-api" className="section student-management-section">
      {/* Section Header */}
      <div className="section-heading">
        <p className="eyebrow">HACKEREARTH CHALLENGE</p>
        <h2>WEEK 07 — STUDENT MANAGEMENT SYSTEM</h2>
        <span className="finder-intro">
          A RESTful Student Management API built with Node.js and Express.js.
        </span>
      </div>

      {/* Technology Badges & GitHub Link */}
      <div className="student-badges-container">
        <div className="tech-badge-group">
          <span className="tech-badge">Node.js</span>
          <span className="tech-badge">Express.js</span>
          <span className="tech-badge">REST API</span>
          <span className="tech-badge">JavaScript</span>
          <span className="tech-badge">React</span>
          <span className="tech-badge highlight">HackerEarth Week 07</span>
        </div>
        <div className="api-links-group">
          <a
            href="https://github.com/THEMENTALIST-EXE/student-management-rest-api"
            target="_blank"
            rel="noopener noreferrer"
            className="api-repo-link"
          >
            <span>API Source Repo ↗</span>
          </a>
          <div className="server-status-pill">
            <span
              className={`status-indicator ${
                apiOnline === true ? 'online' : apiOnline === false ? 'offline' : 'checking'
              }`}
            />
            <span>
              {apiOnline === true
                ? 'API Online'
                : apiOnline === false
                ? 'API Offline'
                : 'Connecting…'}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div className={`notification-toast ${notification.type}`} role="alert">
          <span>{notification.type === 'success' ? '✓' : '⚠️'}</span>
          <p>{notification.message}</p>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setNotification(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* API Offline Guidance Banner */}
      {apiOnline === false && (
        <div className="api-offline-banner">
          <div className="offline-icon">🔌</div>
          <div className="offline-content">
            <h4>Express REST API Server is Offline</h4>
            <p>
              The dashboard connects directly to the Node.js/Express backend at{' '}
              <code>{API_BASE_URL}</code>. If running locally, start the Express server in your terminal:
            </p>
            <div className="terminal-snippet">
              <code>cd week07-student-management-api && npm start</code>
            </div>
          </div>
          <button
            type="button"
            className="secondary-btn retry-btn"
            onClick={() => fetchStudents(activeFilter)}
            disabled={loading}
          >
            {loading ? 'Reconnecting…' : '↻ Retry Connection'}
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="student-stats-grid">
        <div className="student-stat-card">
          <div className="stat-icon-wrapper cyan">👥</div>
          <div className="stat-info">
            <span className="stat-label">Total Students</span>
            <strong className="stat-value">{stats.total}</strong>
            <span className="stat-subtext">Active records in memory</span>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="stat-icon-wrapper green">🏛</div>
          <div className="stat-info">
            <span className="stat-label">Departments</span>
            <strong className="stat-value">{stats.deptCount}</strong>
            <span className="stat-subtext">Academic branches</span>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="stat-icon-wrapper purple">🎓</div>
          <div className="stat-info">
            <span className="stat-label">Top Representation</span>
            <strong className="stat-value">{stats.topSemester}</strong>
            <span className="stat-subtext">Highest enrolled semester</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Dashboard Layout */}
      <div className="student-dashboard-layout">
        {/* Left Column: Student Records Table & Search */}
        <div className="dashboard-table-pane">
          <div className="pane-header">
            <div>
              <h3>Enrolled Students</h3>
              <p className="card-description">
                {activeFilter
                  ? `Filtering by department: "${activeFilter}" (${students.length} found)`
                  : `Showing all ${students.length} students`}
              </p>
            </div>
            <button
              type="button"
              className="refresh-btn"
              onClick={() => fetchStudents(activeFilter)}
              disabled={loading}
              title="Refresh records from Express server"
              aria-label="Refresh records"
            >
              ↻
            </button>
          </div>

          {/* Department Search & Quick Filters */}
          <div className="filter-bar">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search department (e.g., AIML, CSE)..."
                value={departmentQuery}
                onChange={(e) => setDepartmentQuery(e.target.value)}
                aria-label="Search students by department"
              />
              <button type="submit" className="primary-btn search-btn" disabled={loading}>
                Filter
              </button>
              {activeFilter && (
                <button
                  type="button"
                  className="secondary-btn clear-filter-btn"
                  onClick={handleResetFilter}
                  disabled={loading}
                >
                  Clear
                </button>
              )}
            </form>

            {/* Quick Filter Tags */}
            <div className="quick-tags" role="group" aria-label="Quick department filter">
              <span className="tags-label">Quick filter:</span>
              <button
                type="button"
                className={`tag-btn ${activeFilter === '' ? 'active' : ''}`}
                onClick={handleResetFilter}
              >
                All
              </button>
              {SAMPLE_DEPARTMENTS.map((dept) => (
                <button
                  type="button"
                  key={dept}
                  className={`tag-btn ${activeFilter.toUpperCase() === dept ? 'active' : ''}`}
                  onClick={() => handleQuickFilter(dept)}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="pane-alert error" role="alert">
              <span>⚠️</span>
              <p>{generalError}</p>
            </div>
          )}

          {/* Students Table */}
          <div className="table-responsive">
            <table className="student-table" aria-label="Student directory table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '80px' }}>ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Department</th>
                  <th scope="col" style={{ width: '100px' }}>Semester</th>
                  <th scope="col" style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="table-loading-cell">
                      <div className="inline-spinner" />
                      <span>Fetching records from Express server…</span>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="table-empty-cell">
                      <div className="empty-state">
                        <span className="empty-symbol">🔍</span>
                        <p>No students found {activeFilter ? `in department "${activeFilter}"` : 'yet'}.</p>
                        {activeFilter && (
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={handleResetFilter}
                          >
                            Reset Department Filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <span className="student-id-badge">#{student.id}</span>
                      </td>
                      <td className="student-name-cell">
                        <strong>{student.name}</strong>
                      </td>
                      <td>
                        <span className="department-pill">{student.department}</span>
                      </td>
                      <td>
                        <span className="semester-pill">Sem {student.semester}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="action-btn edit-action"
                            onClick={() => openEditModal(student)}
                            disabled={actionLoading}
                            aria-label={`Edit ${student.name}`}
                          >
                            ✎ Edit
                          </button>
                          <button
                            type="button"
                            className="action-btn delete-action"
                            onClick={() => openDeleteModal(student)}
                            disabled={actionLoading}
                            aria-label={`Delete ${student.name}`}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Add Student Form */}
        <div className="dashboard-form-pane">
          <div className="pane-header">
            <div>
              <h3>Add New Student</h3>
              <p className="card-description">Dispatches <code>POST /students</code></p>
            </div>
          </div>

          <form onSubmit={handleAddStudent} className="student-form">
            {formError && (
              <div className="form-error-alert" role="alert">
                <span>⚠️</span>
                <p>{formError}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="student-id-input">
                Student ID <span className="required-star">*</span>
              </label>
              <input
                id="student-id-input"
                type="number"
                min="1"
                step="1"
                placeholder="e.g., 107"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                required
                disabled={actionLoading}
              />
              <span className="field-hint">Must be a unique positive integer</span>
            </div>

            <div className="form-group">
              <label htmlFor="student-name-input">
                Full Name <span className="required-star">*</span>
              </label>
              <input
                id="student-name-input"
                type="text"
                placeholder="e.g., Aditi Rao"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                maxLength="80"
                disabled={actionLoading}
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="student-dept-input">
                  Department <span className="required-star">*</span>
                </label>
                <input
                  id="student-dept-input"
                  type="text"
                  placeholder="e.g., AIML, CSE"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  list="dept-datalist"
                  required
                  disabled={actionLoading}
                />
                <datalist id="dept-datalist">
                  {SAMPLE_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} />
                  ))}
                </datalist>
              </div>

              <div className="form-group flex-1">
                <label htmlFor="student-sem-input">
                  Semester <span className="required-star">*</span>
                </label>
                <select
                  id="student-sem-input"
                  value={newSemester}
                  onChange={(e) => setNewSemester(e.target.value)}
                  disabled={actionLoading}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="primary-btn submit-btn"
              disabled={actionLoading}
            >
              {actionLoading ? 'Creating Student…' : 'Add Student +'}
            </button>
          </form>
        </div>
      </div>

      {/* Edit Student Modal Dialog */}
      {editingStudent && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-dialog-title">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3 id="edit-dialog-title">Edit Student</h3>
                <p className="card-description">
                  Updating record for ID <strong>#{editingStudent.id}</strong> (<code>PUT /students/:id</code>)
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingStudent(null)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="student-form modal-form">
              {editError && (
                <div className="form-error-alert" role="alert">
                  <span>⚠️</span>
                  <p>{editError}</p>
                </div>
              )}

              <div className="form-group">
                <label>Student ID (Immutable)</label>
                <input
                  type="text"
                  value={`#${editingStudent.id}`}
                  disabled
                  readOnly
                  className="read-only-input"
                />
                <span className="field-hint">Original ID is preserved by the API</span>
              </div>

              <div className="form-group">
                <label htmlFor="edit-name-input">Full Name</label>
                <input
                  id="edit-name-input"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  maxLength="80"
                  disabled={actionLoading}
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="edit-dept-input">Department</label>
                  <input
                    id="edit-dept-input"
                    type="text"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    required
                    list="edit-dept-datalist"
                    disabled={actionLoading}
                  />
                  <datalist id="edit-dept-datalist">
                    {SAMPLE_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="edit-sem-input">Semester</label>
                  <select
                    id="edit-sem-input"
                    value={editSemester}
                    onChange={(e) => setEditSemester(e.target.value)}
                    disabled={actionLoading}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditingStudent(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving Changes…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {deletingStudent && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
          <div className="modal-card delete-confirm-card">
            <div className="modal-header">
              <h3 id="delete-dialog-title">Confirm Deletion</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeletingStudent(null)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>
            <div className="delete-modal-body">
              <p>
                Are you sure you want to delete student{' '}
                <strong>{deletingStudent.name}</strong> (ID: #{deletingStudent.id}) from the{' '}
                <strong>{deletingStudent.department}</strong> department?
              </p>
              <p className="card-description warning-text">
                This will trigger <code>DELETE /students/{deletingStudent.id}</code> on the Express backend array.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setDeletingStudent(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={handleDeleteStudent}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section: Developer-Focused API Documentation */}
      <div className="api-docs-container">
        <div className="docs-header">
          <div>
            <p className="eyebrow">DEVELOPER DOCUMENTATION</p>
            <h3>RESTful API Route Reference</h3>
            <p className="card-description">
              Direct endpoints implemented on the Express.js backend server.
            </p>
          </div>
          <span className="docs-base-badge">Base URL: <code>{API_BASE_URL}</code></span>
        </div>

        <div className="api-cards-grid">
          {apiEndpoints.map((ep, idx) => (
            <div key={ep.route + ep.method} className="api-endpoint-card">
              <div className="endpoint-header">
                <span className={`method-badge ${ep.badgeClass}`}>{ep.method}</span>
                <code className="endpoint-route">{ep.route}</code>
              </div>
              <h4 className="endpoint-summary">{ep.summary}</h4>
              <p className="endpoint-desc">{ep.description}</p>

              {ep.exampleBody && (
                <div className="code-snippet-box">
                  <div className="snippet-top">
                    <span>Request Body (JSON)</span>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => copyToClipboard(ep.exampleBody, `body-${idx}`)}
                    >
                      {copiedIndex === `body-${idx}` ? '✓ Copied' : 'Copy JSON'}
                    </button>
                  </div>
                  <pre>
                    <code>{ep.exampleBody}</code>
                  </pre>
                </div>
              )}

              {ep.exampleResponse && (
                <div className="code-snippet-box">
                  <div className="snippet-top">
                    <span>Response Example</span>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => copyToClipboard(ep.exampleResponse, `res-${idx}`)}
                    >
                      {copiedIndex === `res-${idx}` ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre>
                    <code>{ep.exampleResponse}</code>
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
