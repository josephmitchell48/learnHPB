import { useEffect, useState } from 'react'
import type { CaseAssessment } from '../../types/learning'

type AssessmentModuleProps = {
  assessment?: CaseAssessment
  caseId?: string
}

type QuestionResponse = {
  selectedOptionId: string
  status: 'correct' | 'incorrect'
}

const defaultAssessment: CaseAssessment = {
  title: 'Check Your Understanding',
  intro:
    'Use these prompts to validate that you can translate the imaging, documentation, and strategy into a concrete plan.',
  questions: [
    {
      id: 'default-volume-relationship',
      prompt: 'How does the dominant lesion relate to nearby vascular landmarks?',
      options: [
        {
          id: 'default-volume-margin',
          label: 'It abuts without circumferentially encasing the target vessel.',
        },
        {
          id: 'default-volume-encased',
          label: 'It fully encases the vessel, mandating reconstruction.',
        },
        {
          id: 'default-volume-distant',
          label: 'It is remote from the vessel and does not affect margins.',
        },
        {
          id: 'default-volume-portal',
          label: 'It compresses the portal bifurcation rather than the hepatic veins.',
        },
      ],
      correctOptionId: 'default-volume-margin',
      rationale:
        'Many HPB resections hinge on preserving vascular inflow/outflow while clearing tumour. Track how the mass parallels key veins in the 3D view.',
      hint: 'Inspect the venous phase reconstruction to gauge proximity.',
    },
    {
      id: 'default-operative-plan',
      prompt: 'Which operative strategy best matches the case data you reviewed?',
      options: [
        {
          id: 'default-plan-parenchymal',
          label: 'Parenchymal-sparing resection with selective vascular control.',
        },
        {
          id: 'default-plan-transplant',
          label: 'Immediate transplant referral due to unresectability.',
        },
        {
          id: 'default-plan-ablative',
          label: 'Percutaneous ablation replaces operative management.',
        },
        {
          id: 'default-plan-observe',
          label: 'Observation only; no operative intervention is indicated.',
        },
      ],
      correctOptionId: 'default-plan-parenchymal',
      rationale:
        'Stable hepatic reserve with a focal lesion supports a targeted resection with vascular planning rather than transplant or ablation.',
      hint: 'Match the operative plan to the functional reserve in the documents.',
    },
    {
      id: 'default-postop',
      prompt: 'What do the provided laboratory trends imply about postoperative monitoring?',
      options: [
        {
          id: 'default-postop-childA',
          label: 'Child-Pugh A reserve allows routine post-op surveillance.',
        },
        {
          id: 'default-postop-childC',
          label: 'Severe dysfunction requires ICU-level support.',
        },
        {
          id: 'default-postop-portal',
          label: 'Portal hypertension prohibits any resection.',
        },
        {
          id: 'default-postop-unknown',
          label: 'Values are unavailable so risk cannot be assessed.',
        },
      ],
      correctOptionId: 'default-postop-childA',
      rationale:
        'Preserved bilirubin, INR, and albumin suggest Child-Pugh A physiology, so standard labs and imaging suffice postoperatively.',
      hint: 'Revisit the lab document to confirm the hepatic reserve classification.',
    },
  ],
}

const AssessmentModule = ({ assessment, caseId }: AssessmentModuleProps) => {
  const activeAssessment = assessment ?? defaultAssessment
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({})

  const resetKey = `${caseId ?? 'global'}::${
    assessment ? assessment.title : 'default'
  }`

  useEffect(() => {
    setResponses({})
  }, [resetKey])

  if (!activeAssessment || activeAssessment.questions.length === 0) {
    return null
  }

  const titleId = `assessment-title-${caseId ?? 'current'}`

  const handleSelect = (
    questionId: string,
    optionId: string,
    correctOptionId: string,
  ) => {
    setResponses((previous) => {
      const status = optionId === correctOptionId ? 'correct' : 'incorrect'
      return {
        ...previous,
        [questionId]: { selectedOptionId: optionId, status },
      }
    })
  }

  return (
    <section className="assessment-section" aria-labelledby={titleId}>
      <header className="assessment-header">
        <h2 id={titleId}>{activeAssessment.title}</h2>
        <p>{activeAssessment.intro}</p>
      </header>

      <div className="assessment-questions">
        {activeAssessment.questions.map((question, index) => {
          const response = responses[question.id]
          const questionClasses = ['assessment-question']

          if (response) {
            questionClasses.push('is-answered')
            questionClasses.push(`is-${response.status}`)
          }

          return (
            <article
              key={question.id}
              className={questionClasses.join(' ')}
              aria-describedby={
                response ? `assessment-feedback-${question.id}` : undefined
              }
            >
              <header className="assessment-question__header">
                <span className="assessment-question__badge">
                  Question {index + 1}
                </span>
                <h3>{question.prompt}</h3>
              </header>

              <div className="assessment-options" role="group">
                {question.options.map((option) => {
                  const isSelected = response?.selectedOptionId === option.id
                  const isCorrectSelection =
                    response?.status === 'correct' &&
                    option.id === question.correctOptionId
                  const isIncorrectSelection =
                    response?.status === 'incorrect' && isSelected

                  const optionClasses = ['assessment-option']

                  if (isSelected) {
                    optionClasses.push('is-selected')
                  }

                  if (isCorrectSelection) {
                    optionClasses.push('is-correct')
                  }

                  if (isIncorrectSelection) {
                    optionClasses.push('is-incorrect')
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={optionClasses.join(' ')}
                      aria-pressed={isSelected}
                      onClick={() =>
                        handleSelect(
                          question.id,
                          option.id,
                          question.correctOptionId,
                        )
                      }
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>

              {response && (
                <p
                  id={`assessment-feedback-${question.id}`}
                  className={`assessment-feedback assessment-feedback--${response.status}`}
                >
                  {response.status === 'correct'
                    ? `Correct: ${question.rationale}`
                    : question.hint
                      ? `Hint: ${question.hint}`
                      : 'Review the case information and try again.'}
                </p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default AssessmentModule
