import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("=== RESETTING DATABASE & SEEDING 5 BALI BRANCHES (1 CAR PER INSTRUCTOR) ===")

  // 1. Wipe all data completely in strict foreign key order
  await prisma.vehicleReport.deleteMany()
  await prisma.simApplication.deleteMany()
  await prisma.instructorRating.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.course.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.user.deleteMany()
  await prisma.branch.deleteMany()
  await prisma.bankAccount.deleteMany()

  console.log("✓ All existing database tables wiped clean")

  // 2. Create the 5 Official Branches:
  const bHeadOffice = await prisma.branch.create({
    data: {
      name: "Head Office",
      address: "Jl. Kanyeri No. 53, Denpasar",
      city: "Denpasar",
      phone: "0361-234567",
      email: "headoffice@joelmengemudi.com",
    },
  })

  const bSesetan = await prisma.branch.create({
    data: {
      name: "Office Sesetan",
      address: "Jl. Raya Sesetan No. 200 A, Denpasar",
      city: "Denpasar",
      phone: "0361-723456",
      email: "sesetan@joelmengemudi.com",
    },
  })

  const bBangli = await prisma.branch.create({
    data: {
      name: "Office Bangli",
      address: "Jl. Muhammad Hatta, Bangli",
      city: "Bangli",
      phone: "0366-91234",
      email: "bangli@joelmengemudi.com",
    },
  })

  const bMengwi = await prisma.branch.create({
    data: {
      name: "Drop Point Mengwi",
      address: "Jl. Gulingan, Sukawati, Badung",
      city: "Badung",
      phone: "0361-891234",
      email: "mengwi@joelmengemudi.com",
    },
  })

  const bGianyar = await prisma.branch.create({
    data: {
      name: "Office Gianyar",
      address: "Jl. Celuk, Sukawati, Gianyar",
      city: "Gianyar",
      phone: "0361-945678",
      email: "gianyar@joelmengemudi.com",
    },
  })

  const branches = [bHeadOffice, bSesetan, bBangli, bMengwi, bGianyar]
  console.log("✓ 5 Official Branches created")

  const defaultPassword = await hash("password123", 12)

  // 3. Create Owner Account
  await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "owner@demo.com",
      phone: "081122334455",
      password: defaultPassword,
      role: "OWNER",
      gender: "MALE",
      address: "Jl. Kanyeri No. 53, Denpasar",
    },
  })
  console.log("✓ Owner created (owner@demo.com)")

  // 4. Create 1 Customer Service per branch (Total 5 CS)
  const csAccounts = [
    { name: "Siti Rahayu (CS Head Office)", email: "cs@demo.com", phone: "081234567801", branchId: bHeadOffice.id, address: "Denpasar" },
    { name: "Ni Putu Ayu (CS Sesetan)", email: "cs.sesetan@demo.com", phone: "081234567802", branchId: bSesetan.id, address: "Sesetan, Denpasar" },
    { name: "Ni Luh Made (CS Bangli)", email: "cs.bangli@demo.com", phone: "081234567803", branchId: bBangli.id, address: "Bangli" },
    { name: "Ni Kadek Desi (CS Mengwi)", email: "cs.mengwi@demo.com", phone: "081234567804", branchId: bMengwi.id, address: "Mengwi, Badung" },
    { name: "Ni Komang Sri (CS Gianyar)", email: "cs.gianyar@demo.com", phone: "081234567805", branchId: bGianyar.id, address: "Sukawati, Gianyar" },
  ]

  for (const cs of csAccounts) {
    await prisma.user.create({
      data: {
        name: cs.name,
        email: cs.email,
        phone: cs.phone,
        password: defaultPassword,
        role: "CUSTOMER_SERVICE",
        gender: "FEMALE",
        address: cs.address,
        branchId: cs.branchId,
      },
    })
  }
  console.log("✓ 5 Customer Service created (1 per branch)")

  // 5. Create 7 Standard Course Packages per branch (Total 35 Packages)
  const courseTemplates = [
    {
      name: "Paket Manual 4 Jam",
      description: "Paket Pemula: 4 Jam Latihan (2x sesi latihan @ 2 jam setiap sesi)",
      courseType: "MANUAL" as const,
      duration: 4,
      sessions: 2,
      price: 525000,
    },
    {
      name: "Paket Manual 8 Jam",
      description: "Paket Standar: 8 Jam Latihan (4x sesi latihan @ 2 jam setiap sesi)",
      courseType: "MANUAL" as const,
      duration: 8,
      sessions: 4,
      price: 950000,
    },
    {
      name: "Paket Manual 10 Jam",
      description: "Paket Mahir: 10 Jam Latihan (5x sesi latihan @ 2 jam setiap sesi)",
      courseType: "MANUAL" as const,
      duration: 10,
      sessions: 5,
      price: 1150000,
    },
    {
      name: "Paket Matic 4 Jam",
      description: "Paket Pemula: 4 Jam Latihan (2x sesi latihan @ 2 jam setiap sesi)",
      courseType: "AUTOMATIC" as const,
      duration: 4,
      sessions: 2,
      price: 525000,
    },
    {
      name: "Paket Matic 8 Jam",
      description: "Paket Standar: 8 Jam Latihan (4x sesi latihan @ 2 jam setiap sesi)",
      courseType: "AUTOMATIC" as const,
      duration: 8,
      sessions: 4,
      price: 950000,
    },
    {
      name: "Paket Matic 10 Jam",
      description: "Paket Mahir: 10 Jam Latihan (5x sesi latihan @ 2 jam setiap sesi)",
      courseType: "AUTOMATIC" as const,
      duration: 10,
      sessions: 5,
      price: 1150000,
    },
    {
      name: "Paket Mix Manual & Matic",
      description: "Paket Kombinasi: Manual 8 Jam + Matic 4 Jam (4x sesi manual dan 2x sesi matic @ 2 jam setiap sesi)",
      courseType: "BOTH" as const,
      duration: 12,
      sessions: 6,
      price: 1475000,
    },
    // PAKET KURSUS + PEMBUATAN SIM A (PENDEKATAN A)
    {
      name: "Paket Manual + SIM A 10 Jam",
      description: "Paket Lengkap: 10 Jam Latihan (5x sesi latihan @ 2 jam setiap sesi, sudah termasuk pembuatan SIM A)",
      courseType: "MANUAL" as const,
      duration: 10,
      sessions: 5,
      price: 1830000,
    },
    {
      name: "Paket Matic + SIM A 10 Jam",
      description: "Paket Lengkap: 10 Jam Latihan (5x sesi latihan @ 2 jam setiap sesi, sudah termasuk pembuatan SIM A)",
      courseType: "AUTOMATIC" as const,
      duration: 10,
      sessions: 5,
      price: 1830000,
    },
    {
      name: "Paket Mix (Manual 8h + Matic 4h) + SIM A",
      description: "Paket All-in-One: Manual 8 Jam + Matic 4 Jam (4x sesi manual dan 2x sesi matic @ 2 jam setiap sesi, sudah termasuk pembuatan SIM A)",
      courseType: "BOTH" as const,
      duration: 12,
      sessions: 6,
      price: 2155000,
    },
  ]

  const createdCourses: any[] = []
  for (const b of branches) {
    for (const ct of courseTemplates) {
      const c = await prisma.course.create({
        data: {
          ...ct,
          branchId: b.id,
        },
      })
      createdCourses.push(c)
    }
  }
  console.log(`✓ ${createdCourses.length} Course Packages created (10 per branch: 7 reguler + 3 paket kursus + SIM A)`)

  // 6. Create EXACTLY 5 Instructors per branch (Total 25 Instructors)
  // In each branch: 3 Manual Instructors and 2 Automatic Instructors
  const instructorProfiles = [
    // Branch 1: Head Office (5)
    { name: "Ahmad Fauzi", spec: "MANUAL" as const },
    { name: "I Wayan Sudira", spec: "MANUAL" as const },
    { name: "I Made Sujana", spec: "MANUAL" as const },
    { name: "I Nyoman Ardana", spec: "AUTOMATIC" as const },
    { name: "I Ketut Wirawan", spec: "AUTOMATIC" as const },

    // Branch 2: Office Sesetan (5)
    { name: "I Wayan Raka", spec: "MANUAL" as const },
    { name: "I Made Sukadana", spec: "MANUAL" as const },
    { name: "I Nyoman Subagia", spec: "MANUAL" as const },
    { name: "I Ketut Suartana", spec: "AUTOMATIC" as const },
    { name: "Gede Eka Putra", spec: "AUTOMATIC" as const },

    // Branch 3: Office Bangli (5)
    { name: "I Wayan Mandra", spec: "MANUAL" as const },
    { name: "I Made Sugiarta", spec: "MANUAL" as const },
    { name: "I Nyoman Yasa", spec: "MANUAL" as const },
    { name: "I Ketut Guna", spec: "AUTOMATIC" as const },
    { name: "Gede Sukarma", spec: "AUTOMATIC" as const },

    // Branch 4: Drop Point Mengwi (5)
    { name: "I Wayan Tirtayasa", spec: "MANUAL" as const },
    { name: "I Made Wirata", spec: "MANUAL" as const },
    { name: "I Nyoman Kaler", spec: "MANUAL" as const },
    { name: "I Ketut Suweta", spec: "AUTOMATIC" as const },
    { name: "Gede Merta", spec: "AUTOMATIC" as const },

    // Branch 5: Office Gianyar (5)
    { name: "I Wayan Celuk", spec: "MANUAL" as const },
    { name: "I Made Sukawati", spec: "MANUAL" as const },
    { name: "I Nyoman Gianyar", spec: "MANUAL" as const },
    { name: "I Ketut Ubud", spec: "AUTOMATIC" as const },
    { name: "Gede Batubulan", spec: "AUTOMATIC" as const },
  ]

  const createdInstructors: any[] = []
  for (let bIndex = 0; bIndex < branches.length; bIndex++) {
    const branch = branches[bIndex]

    for (let i = 0; i < 5; i++) {
      const globalIdx = bIndex * 5 + i
      const profile = instructorProfiles[globalIdx]
      const isMainDemo = globalIdx === 0
      const email = isMainDemo ? "instruktur@demo.com" : `instruktur.${bIndex + 1}.${i + 1}@demo.com`
      const phone = `08127788${(bIndex + 1).toString().padStart(2, "0")}${(i + 1).toString().padStart(2, "0")}`
      const licenseNumber = `SIM-A-BALI-${(bIndex + 1) * 100 + i + 1}`

      const inst = await prisma.user.create({
        data: {
          name: profile.name,
          email,
          phone,
          password: defaultPassword,
          role: "INSTRUCTOR",
          gender: "MALE",
          address: branch.address,
          branchId: branch.id,
          licenseNumber,
          specialization: profile.spec,
        },
      })
      createdInstructors.push(inst)
    }
  }
  console.log(`✓ Exactly ${createdInstructors.length} Instructors created (5 per branch x 5 branches)`)

  // 7. Create EXACTLY 5 Vehicles per branch (Total 25 Vehicles)
  // Each vehicle is STRICTLY DEDICATED 1:1 to one instructor matching transmission!
  // ALL PLATES MUST BE "DK" (Bali region)
  const branchPlateSuffixes = ["HO", "SS", "BG", "MW", "GY"]
  const carTemplates = [
    // 3 Manual cars for 3 Manual instructors
    { brand: "Toyota", model: "Avanza G", year: 2023, transmission: "MANUAL" as const },
    { brand: "Daihatsu", model: "Xenia R", year: 2022, transmission: "MANUAL" as const },
    { brand: "Suzuki", model: "Ertiga GL", year: 2023, transmission: "MANUAL" as const },
    // 2 Automatic cars for 2 Automatic instructors
    { brand: "Honda", model: "Brio Satya E", year: 2024, transmission: "AUTOMATIC" as const },
    { brand: "Toyota", model: "Agya GR", year: 2023, transmission: "AUTOMATIC" as const },
  ]

  const createdVehicles: any[] = []
  for (let bIndex = 0; bIndex < branches.length; bIndex++) {
    const branch = branches[bIndex]
    const suffix = branchPlateSuffixes[bIndex]
    const branchInstructors = createdInstructors.filter(inst => inst.branchId === branch.id)

    for (let v = 0; v < 5; v++) {
      const modelInfo = carTemplates[v]
      const dedicatedInstructor = branchInstructors[v]
      const plateNumber = `DK ${1000 + (bIndex + 1) * 10 + (v + 1)} ${suffix}`

      const veh = await prisma.vehicle.create({
        data: {
          plateNumber,
          brand: modelInfo.brand,
          model: modelInfo.model,
          year: modelInfo.year,
          transmission: modelInfo.transmission,
          branchId: branch.id,
          instructorId: dedicatedInstructor.id, // Dedicated 1:1 to this instructor
          isActive: true,
        },
      })
      createdVehicles.push(veh)
    }
  }
  console.log(`✓ Exactly ${createdVehicles.length} Vehicles created (5 per branch x 5 branches, 1:1 dedicated to instructors, ALL DK PLATES)`)

  // 8. Create EXACTLY 10 Students per branch (Total 50 Students)
  const studentFirstNames = [
    "Rina", "Ni Putu", "Ni Made", "Ni Nyoman", "Ni Ketut",
    "Dewi", "Ghea", "Maya", "Ayu", "Komang",
    "Kevin", "Marcus", "Fajar", "Doni", "Rizky",
    "Dadan", "Andi", "Bayu", "Gilang", "Bagus"
  ]

  const studentLastNames = [
    "Wati", "Lestari", "Sanjaya", "Gideon", "Alfian",
    "Prasetyo", "Indrawari", "Ramdhan", "Firmansyah", "Skak",
    "Sari", "Dirga", "Dharma", "Laksmi", "Mahardika",
    "Pradnyana", "Suputra", "Wirawan", "Sukadana", "Wijaya"
  ]

  const createdStudents: any[] = []
  for (let bIndex = 0; bIndex < branches.length; bIndex++) {
    const branch = branches[bIndex]

    for (let s = 0; s < 10; s++) {
      const globalIdx = bIndex * 10 + s
      const isMainDemo = globalIdx === 0 // first student is siswa@demo.com
      const fName = studentFirstNames[(s + bIndex * 2) % studentFirstNames.length]
      const lName = studentLastNames[(s + bIndex * 3) % studentLastNames.length]
      const name = `${fName} ${lName}`
      const email = isMainDemo ? "siswa@demo.com" : `siswa.${bIndex + 1}.${s + 1}@demo.com`
      const phone = `08139900${(bIndex + 1).toString().padStart(2, "0")}${(s + 1).toString().padStart(2, "0")}`
      const gender = s % 2 === 0 ? ("FEMALE" as const) : ("MALE" as const)

      const stu = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: defaultPassword,
          role: "STUDENT",
          gender,
          address: `${branch.city}, Bali`,
          branchId: branch.id,
        },
      })
      createdStudents.push(stu)
    }
  }
  console.log(`✓ Exactly ${createdStudents.length} Students created (10 per branch x 5 branches)`)

  // 9. Enroll Students, Assign to matching Instructor & their Fixed Vehicle, Schedules & Payments
  const baseDate = new Date()
  const timeSlots = ["08:00", "10:00", "13:00", "15:00"]

  const reviewsPool = [
    "Instruktur sangat sabar dan teliti. Mobil Avanza manual latihannya sangat bersih dan terawat.",
    "Pelatih ramah dan datang tepat waktu dengan mobil Honda Brio maticnya yang nyaman. Sangat puas!",
    "Mobil latihan sangat nyaman dan dingin. Instruktur memberi rasa aman di jalan raya.",
    "Penjelasan teknik kopling dan tanjakan sangat jelas. Langsung lancar di sesi kedua.",
    "Sangat merekomendasikan joelmengemudi! Instruktur dan unit mobilnya prima.",
  ]

  let totalSchedulesCount = 0

  for (let sIdx = 0; sIdx < createdStudents.length; sIdx++) {
    const student = createdStudents[sIdx]
    const bId = student.branchId!

    // Pick course package for this student
    const branchCourses = createdCourses.filter(c => c.branchId === bId)
    const chosenCourse = branchCourses[sIdx % branchCourses.length]

    // Create Enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: chosenCourse.id,
        branchId: bId,
        startDate: new Date(baseDate.getTime() - (sIdx % 3) * 86400000 * 2),
        status: "ACTIVE",
        notes: `Pendaftaran resmi siswa ${student.name} paket ${chosenCourse.name}`,
      },
    })

    // Find instructor in this branch matching course transmission
    const branchInstructorsList = createdInstructors.filter(i => i.branchId === bId)
    let matchingInstructors = branchInstructorsList.filter(i => {
      if (chosenCourse.courseType === "MANUAL") return i.specialization === "MANUAL"
      if (chosenCourse.courseType === "AUTOMATIC") return i.specialization === "AUTOMATIC"
      return true // BOTH
    })
    if (matchingInstructors.length === 0) matchingInstructors = branchInstructorsList

    const assignedInstructor = matchingInstructors[sIdx % matchingInstructors.length]

    // The vehicle is strictly the instructor's dedicated vehicle!
    const assignedVehicle = createdVehicles.find(v => v.instructorId === assignedInstructor.id) ||
      createdVehicles.filter(v => v.branchId === bId)[0]

    // Pick time slot
    const slotStartTime = timeSlots[sIdx % timeSlots.length]
    const startHourNum = parseInt(slotStartTime.split(":")[0], 10)
    const slotEndTime = `${(startHourNum + 2).toString().padStart(2, "0")}:00`

    // Generate all sessions for this enrollment
    for (let sess = 0; sess < chosenCourse.sessions; sess++) {
      const isPast = sess < Math.min(2, chosenCourse.sessions - 1) && sIdx % 2 === 0
      const dayOffset = (sIdx % 4) - 2 + sess * 2
      const schedDate = new Date(baseDate.getTime() + dayOffset * 86400000)

      let lessonType: "THEORY" | "PRACTICE" | "EXAM" = "PRACTICE"
      if (chosenCourse.sessions > 1 && sess === 0) lessonType = "THEORY"
      else if (sess === chosenCourse.sessions - 1) lessonType = "EXAM"

      const schedule = await prisma.schedule.create({
        data: {
          enrollmentId: enrollment.id,
          instructorId: assignedInstructor.id,
          courseId: chosenCourse.id,
          branchId: bId,
          vehicleId: assignedVehicle.id, // Fixed car dedicated to this instructor
          date: schedDate,
          startTime: slotStartTime,
          endTime: slotEndTime,
          lessonType,
          status: isPast ? "COMPLETED" : "SCHEDULED",
          notes: `Sesi ${sess + 1} dari ${chosenCourse.sessions} (2 Jam Latihan) bersama ${assignedVehicle.brand} ${assignedVehicle.plateNumber}`,
        },
      })
      totalSchedulesCount++

      // If completed, add attendance and rating
      if (isPast) {
        await prisma.attendance.create({
          data: {
            scheduleId: schedule.id,
            studentId: student.id,
            isPresent: true,
            score: 78 + (sess * 5) + (sIdx % 12),
            feedback: sess === 0
              ? "Teori dasar & etika berkendara dipahami dengan baik."
              : `Pengendalian kemudi mobil ${assignedVehicle.brand} sangat halus.`,
          },
        })

        const ratingScore = 4 + ((sIdx + sess) % 2)
        await prisma.instructorRating.create({
          data: {
            rating: ratingScore,
            review: reviewsPool[(sIdx + sess) % reviewsPool.length],
            studentId: student.id,
            instructorId: assignedInstructor.id,
            scheduleId: schedule.id,
            branchId: bId,
          },
        })
      }
    }

    // Create Payment (Alternate Confirmed full, Half DP 50%, and Pending Invoice)
    const payMode = sIdx % 3
    if (payMode === 0) {
      await prisma.payment.create({
        data: {
          studentId: student.id,
          enrollmentId: enrollment.id,
          amount: chosenCourse.price,
          status: "CONFIRMED",
          bankName: "BCA",
          accountName: student.name,
          accountNumber: `081${sIdx}8899001`,
          confirmedAt: new Date(),
          notes: "Pembayaran Lunas (100%) via transfer m-banking",
        },
      })
    } else if (payMode === 1) {
      await prisma.payment.create({
        data: {
          studentId: student.id,
          enrollmentId: enrollment.id,
          amount: chosenCourse.price / 2,
          status: "CONFIRMED",
          bankName: "BRI",
          accountName: student.name,
          accountNumber: `081${sIdx}8899002`,
          confirmedAt: new Date(),
          notes: "Pembayaran Uang Muka (DP 50%) via m-banking",
        },
      })
    } else {
      await prisma.payment.create({
        data: {
          studentId: student.id,
          enrollmentId: enrollment.id,
          amount: chosenCourse.price / 2,
          status: "PENDING",
          bankName: "Mandiri",
          accountName: student.name,
          accountNumber: `081${sIdx}8899003`,
          notes: "Tagihan DP 50% diterbitkan Customer Service",
        },
      })
    }
  }

  // 10. Official Bank Accounts
  await prisma.bankAccount.createMany({
    data: [
      { bankName: "BCA", accountNumber: "1234567890", accountName: "PT Joel Mengemudi Jaya", isActive: true },
      { bankName: "BRI", accountNumber: "0987654321", accountName: "PT Joel Mengemudi Jaya", isActive: true },
      { bankName: "Mandiri", accountNumber: "1122334455", accountName: "PT Joel Mengemudi Jaya", isActive: true },
    ],
  })
  console.log("✓ Official Bank Accounts created")

  // 11. Create Realistic Sample SIM Applications (Layanan Pembuatan SIM Khusus: SIM A 700rb & SIM C 625rb)
  const sampleSimApps = [
    {
      studentId: createdStudents[0].id,
      branchId: bHeadOffice.id,
      simType: "SIM_A" as const,
      price: 700000,
      fullName: createdStudents[0].name,
      nik: "5171015509980001",
      phone: createdStudents[0].phone || "081399000101",
      address: "Jl. Kanyeri No. 10, Denpasar",
      status: "SCHEDULED_SATPAS" as const,
      paymentStatus: "CONFIRMED" as const,
      bankName: "BCA",
      accountName: createdStudents[0].name,
      accountNumber: "1234567890",
      satpasDate: new Date(baseDate.getTime() + 3 * 86400000),
      notes: "Uji teori & praktik Satpas Polresta Denpasar didampingi instruktur Ahmad Fauzi.",
    },
    {
      studentId: createdStudents[1].id,
      branchId: bHeadOffice.id,
      simType: "SIM_C" as const,
      price: 625000,
      fullName: createdStudents[1].name,
      nik: "5171015509980002",
      phone: createdStudents[1].phone || "081399000102",
      address: "Jl. Hayam Wuruk No. 25, Denpasar",
      status: "VERIFIED" as const,
      paymentStatus: "CONFIRMED" as const,
      bankName: "BRI",
      accountName: createdStudents[1].name,
      accountNumber: "0987654321",
      notes: "Berkas KTP & Surat Kesehatan lengkap diverifikasi CS.",
    },
    {
      studentId: createdStudents[10].id, // Sesetan student
      branchId: bSesetan.id,
      simType: "SIM_A" as const,
      price: 700000,
      fullName: createdStudents[10].name,
      nik: "5171025509980011",
      phone: createdStudents[10].phone || "081399000201",
      address: "Jl. Raya Sesetan No. 55, Denpasar",
      status: "SUBMITTED" as const,
      paymentStatus: "PENDING" as const,
      bankName: "Mandiri",
      accountName: createdStudents[10].name,
      accountNumber: "1122334455",
      notes: "Pengajuan baru SIM A, menunggu verifikasi bukti transfer.",
    },
    {
      studentId: createdStudents[20].id, // Bangli student
      branchId: bBangli.id,
      simType: "SIM_C" as const,
      price: 625000,
      fullName: createdStudents[20].name,
      nik: "5106015509980021",
      phone: createdStudents[20].phone || "081399000301",
      address: "Jl. Brigjen Ngurah Rai No. 8, Bangli",
      status: "COMPLETED" as const,
      paymentStatus: "CONFIRMED" as const,
      bankName: "BCA",
      accountName: createdStudents[20].name,
      accountNumber: "1234567890",
      notes: "SIM C telah selesai dicetak & diserahkan ke siswa.",
    },
  ]

  for (const sim of sampleSimApps) {
    await prisma.simApplication.create({ data: sim })
  }
  console.log(`✓ ${sampleSimApps.length} Sample SIM Applications created (SIM A @ Rp 700.000 & SIM C @ Rp 625.000)`)

  console.log("\n========================================================")
  console.log("DATABASE SEEDED WITH 1 CAR PER INSTRUCTOR:")
  console.log("1. Head Office             (Jl. Kanyeri No. 53, Denpasar)")
  console.log("2. Office Sesetan          (Jl. Raya Sesetan No. 200 A, Denpasar)")
  console.log("3. Office Bangli           (Jl. Muhammad Hatta, Bangli)")
  console.log("4. Drop Point Mengwi       (Jl. Gulingan, Sukawati, Badung)")
  console.log("5. Office Gianyar          (Jl. Celuk, Sukawati, Gianyar)")
  console.log("--------------------------------------------------------")
  console.log(`Total Branches:    5 branches`)
  console.log(`Total Instructors: ${createdInstructors.length} (5 per branch x 5 branches)`)
  console.log(`Total Vehicles:    ${createdVehicles.length} (5 per branch x 5 branches, 1:1 dedicated, ALL DK PLATES)`)
  console.log(`Total Students:    ${createdStudents.length} (10 per branch x 5 branches)`)
  console.log(`Total CS Staff:    5 CS (1 per branch)`)
  console.log(`Total Packages:    ${createdCourses.length} course packages (10 per branch: 7 reguler + 3 kursus & SIM)`)
  console.log(`Total Schedules:   ${totalSchedulesCount} distributed session schedules`)
  console.log("========================================================")
  console.log("Demo Accounts (Password: password123):")
  console.log("  Owner:            owner@demo.com")
  console.log("  CS Head Office:   cs@demo.com")
  console.log("  CS Sesetan:       cs.sesetan@demo.com")
  console.log("  CS Bangli:        cs.bangli@demo.com")
  console.log("  CS Mengwi:        cs.mengwi@demo.com")
  console.log("  CS Gianyar:       cs.gianyar@demo.com")
  console.log("  Instruktur:       instruktur@demo.com")
  console.log("  Siswa:            siswa@demo.com")
  console.log("========================================================\n")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
