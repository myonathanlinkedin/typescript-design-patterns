type CourseID = string

interface Course {
  id: CourseID
  name: string
  credits: number
  prereq?: PreReq
}

type PreReqNode = AndNode | OrNode | CourseNode

interface AndNode {
  type: 'and'
  children: PreReqNode[]
}
interface OrNode {
  type: 'or'
  children: PreReqNode[]
}
interface CourseNode {
  type: 'course'
  id: CourseID
}

class PreReq {
  private root: PreReqNode

  private constructor(root: PreReqNode) {
    this.root = root
  }

  static course(id: CourseID): PreReq {
    return new PreReq({ type: 'course', id })
  }

  static and(...nodes: PreReq[]): PreReq {
    return new PreReq({ type: 'and', children: nodes.map(n => n.root) })
  }

  static or(...nodes: PreReq[]): PreReq {
    return new PreReq({ type: 'or', children: nodes.map(n => n.root) })
  }

  isSatisfied(completed: Set<CourseID>): boolean {
    const evalNode = (node: PreReqNode): boolean => {
      switch (node.type) {
        case 'course':
          return completed.has(node.id)
        case 'and':
          return node.children.every(evalNode)
        case 'or':
          return node.children.some(evalNode)
      }
    }
    return evalNode(this.root)
  }
}

type Requirement =
  | CoreRequirement
  | ElectiveRequirement
  | CreditRequirement

interface CoreRequirement {
  type: 'core'
  courseId: CourseID
  description?: string
}
interface ElectiveRequirement {
  type: 'elective'
  courseIds: Set<CourseID>
  minCount: number
  description?: string
}
interface CreditRequirement {
  type: 'credits'
  minCredits: number
  description?: string
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  totalCredits: number
  completedCourses: Set<CourseID>
}

function validatePlan(
  plan: CourseID[][],
  catalog: Map<CourseID, Course>,
  requirements: Requirement[]
): ValidationResult {
  const errors: string[] = []
  const completed = new Set<CourseID>()
  let totalCredits = 0

  for (let termIdx = 0; termIdx < plan.length; termIdx++) {
    const term = plan[termIdx]
    const termCompletedBefore = new Set(completed) // snapshot before term

    for (const cid of term) {
      const course = catalog.get(cid)
      if (!course) {
        errors.push(`Term ${termIdx + 1}: Unknown course ${cid}`)
        continue
      }
      if (completed.has(cid)) {
        errors.push(`Term ${termIdx + 1}: Duplicate enrollment in ${cid}`)
        continue
      }
      if (course.prereq && !course.prereq.isSatisfied(termCompletedBefore)) {
        errors.push(`Term ${termIdx + 1}: Prerequisite not satisfied for ${cid}`)
        continue
      }
      completed.add(cid)
      totalCredits += course.credits
    }
  }

  // Requirement checks
  for (const req of requirements) {
    switch (req.type) {
      case 'core':
        if (!completed.has(req.courseId)) {
          errors.push(`Missing core course ${req.courseId}`)
        }
        break
      case 'elective':
        const count = [...completed].filter(c => req.courseIds.has(c)).length
        if (count < req.minCount) {
          errors.push(`Elective requirement unmet: need ${req.minCount}, have ${count}`)
        }
        break
      case 'credits':
        if (totalCredits < req.minCredits) {
          errors.push(`Credit requirement unmet: need ${req.minCredits}, have ${totalCredits}`)
        }
        break
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    totalCredits,
    completedCourses: completed,
  }
}

/* ---------- Unit Tests ---------- */
function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

// Sample catalog
const catalog = new Map<CourseID, Course>([
  ['CS101', { id: 'CS101', name: 'Intro CS', credits: 3 }],
  ['CS102', { id: 'CS102', name: 'Data Structures', credits: 4, prereq: PreReq.course('CS101') }],
  ['CS201', { id: 'CS201', name: 'Algorithms', credits: 4, prereq: PreReq.and(PreReq.course('CS102')) }],
  ['MATH101', { id: 'MATH101', name: 'Calculus I', credits: 4 }],
  ['MATH102', { id: 'MATH102', name: 'Calculus II', credits: 4, prereq: PreReq.course('MATH101') }],
  ['ENG101', { id: 'ENG101', name: 'English Composition', credits: 3 }],
])

// Requirements
const requirements: Requirement[] = [
  { type: 'core', courseId: 'CS101' },
  { type: 'core', courseId: 'CS102' },
  { type: 'elective', courseIds: new Set(['MATH101', 'MATH102', 'ENG101']), minCount: 2 },
  { type: 'credits', minCredits: 20 },
]

// Valid plan
const validPlan: CourseID[][] = [
  ['CS101', 'MATH101'],
  ['CS102', 'ENG101'],
  ['CS201', 'MATH102'],
]

const validResult = validatePlan(validPlan, catalog, requirements)
assert(validResult.valid, 'Valid plan should pass')
assert(validResult.totalCredits === 22, 'Total credits should be 22')
assert(validResult.errors.length === 0, 'No errors expected')

// Invalid plan: missing prerequisite, missing elective, insufficient credits
const invalidPlan: CourseID[][] = [
  ['CS102'], // CS101 missing
  ['CS201'], // CS102 missing
  ['ENG101'],
]

const invalidResult = validatePlan(invalidPlan, catalog, requirements)
assert(!invalidResult.valid, 'Invalid plan should fail')
assert(invalidResult.errors.includes('Term 1: Prerequisite not satisfied for CS102'), 'Detect missing prereq')
assert(invalidResult.errors.includes('Missing core course CS101'), 'Detect missing core')
assert(invalidResult.errors.includes('Elective requirement unmet: need 2, have 1'), 'Detect elective shortfall')
assert(invalidResult.errors.includes('Credit requirement unmet: need 20, have 11'), 'Detect credit shortfall')

console.log('All tests passed.')
