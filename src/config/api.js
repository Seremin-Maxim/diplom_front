// Конфигурация API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const API = {
  AUTH: {
    SIGNIN: `${API_BASE_URL}/api/auth/signin`,
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  },
  USERS: {
    PROFILE: `${API_BASE_URL}/api/users/profile`,
  },
  COURSES: {
    BASE: `${API_BASE_URL}/api/courses`,
    BY_ID: (id) => `${API_BASE_URL}/api/courses/${id}`,
    TEACHER: `${API_BASE_URL}/api/courses/teacher`,
    PUBLIC: `${API_BASE_URL}/api/courses/public`,
  },
  LESSONS: {
    BASE: `${API_BASE_URL}/api/lessons`,
    BY_ID: (id) => `${API_BASE_URL}/api/lessons/${id}`,
    BY_COURSE_ID: (courseId) => `${API_BASE_URL}/api/lessons/course/${courseId}`,
    CONTENT_BY_COURSE_ID: (courseId) => `${API_BASE_URL}/api/lessons/course/${courseId}/content`,
  },
  TESTS: {
    BASE: `${API_BASE_URL}/api/tests`,
    BY_ID: (id) => `${API_BASE_URL}/api/tests/${id}`,
    BY_LESSON_ID: (lessonId) => `${API_BASE_URL}/api/tests/lesson/${lessonId}`,
    BY_LESSON_ID_AND_TYPE: (lessonId, type) => `${API_BASE_URL}/api/tests/lesson/${lessonId}/type/${type}`,
  },
  QUESTIONS: {
    BASE: `${API_BASE_URL}/api/questions`,
    BY_ID: (id) => `${API_BASE_URL}/api/questions/${id}`,
    BY_TEST_ID: (testId) => `${API_BASE_URL}/api/questions/test/${testId}`,
    BY_TEST_ID_AND_TYPE: (testId, type) => `${API_BASE_URL}/api/questions/test/${testId}/type/${type}`,
  },
  ANSWERS: {
    BASE: `${API_BASE_URL}/api/answers`,
    BY_ID: (id) => `${API_BASE_URL}/api/answers/${id}`,
    BY_QUESTION_ID: (questionId) => `${API_BASE_URL}/api/answers/question/${questionId}`,
    SINGLE_CHOICE: (questionId) => `${API_BASE_URL}/api/answers/question/${questionId}/single-choice`,
    MULTIPLE_CHOICE: (questionId) => `${API_BASE_URL}/api/answers/question/${questionId}/multiple-choice`,
  },
  ENROLLMENTS: {
    COURSES: {
      BASE: `${API_BASE_URL}/api/enrollments/courses`,
      ENROLL: (courseId) => `${API_BASE_URL}/api/enrollments/courses/${courseId}`,
      UNENROLL: (courseId) => `${API_BASE_URL}/api/enrollments/courses/${courseId}`,
      STUDENT_COURSES: `${API_BASE_URL}/api/enrollments/courses/my`,
      CHECK_ENROLLMENT: (courseId) => `${API_BASE_URL}/api/enrollments/courses/${courseId}/status`,
    },
    LESSONS: {
      BASE: `${API_BASE_URL}/api/enrollments/lessons`,
      ENROLL: (lessonId) => `${API_BASE_URL}/api/enrollments/lessons/${lessonId}`,
      COMPLETE: (lessonId) => `${API_BASE_URL}/api/enrollments/lessons/${lessonId}/complete`,
      AVAILABLE_LESSONS: (courseId) => `${API_BASE_URL}/api/enrollments/lessons/course/${courseId}/available-lessons`,
      ACCESS: (lessonId, token) => `${API_BASE_URL}/api/enrollments/lessons/access/${lessonId}?token=${token}`,
      CHECK_COMPLETION: (lessonId) => `${API_BASE_URL}/api/enrollments/lessons/${lessonId}/completed`,
      CHECK_ENROLLMENT: (lessonId) => `${API_BASE_URL}/api/enrollments/lessons/${lessonId}/status`,
    },
  },
  TESTS_ACCESS: {
    AVAILABLE_TESTS: (lessonId) => `${API_BASE_URL}/api/tests/access/lesson/${lessonId}/available-tests`,
    ACCESS: (testId, token) => `${API_BASE_URL}/api/tests/access/${testId}?token=${token}`,
  },
  SUBMISSIONS: {
    SUBMIT: `${API_BASE_URL}/api/submissions`,
    BY_ID: (id) => `${API_BASE_URL}/api/submissions/${id}`,
    BY_TEST_ID: (testId) => `${API_BASE_URL}/api/submissions/test/${testId}`,
    BY_STUDENT_ID: (studentId) => `${API_BASE_URL}/api/submissions/student/${studentId}`,
  },
  STATISTICS: {
    COURSE: (courseId) => `${API_BASE_URL}/api/statistics/course/${courseId}`,
    TEACHER: (teacherId) => `${API_BASE_URL}/api/statistics/teacher/${teacherId}`,
    TEACHER_ME: `${API_BASE_URL}/api/statistics/teacher/me`,
    STUDENT_ME: `${API_BASE_URL}/api/statistics/student/me`,
  },
};

export default API;
