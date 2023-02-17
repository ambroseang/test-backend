import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer/dist";
import { TrainerService } from "src/trainer/trainer.service";
import { UserService } from "src/user/user.service";
import { GetUserDto } from "src/user/dto";
import { Email } from "src/interfaces/email.interfaces";
import { Status, CourseSegment } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "src/prisma/prisma.service";
import { GetCourseSegmentDto } from "src/course/dto/get-course-segment.dto";
import { SIGN_OFF, FROM_ADDRESS } from "./notification.config";
import { EditCourseSegmentDto } from "src/course/dto";
import { resourceLimits } from "worker_threads";

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private readonly mailerService: MailerService,
    private readonly trainerService: TrainerService,
    private readonly userService: UserService,
    private configService: ConfigService,
  ) {}

  private FRONTEND_URL: string = this.configService.get("FRONTEND_URL");
  private VERSION_REGEX = /:V[0-9]$/;

  private conversion(word: string) {
    const result: string = word.substring(1).toLowerCase();
    return word[0] + result;
  }

  private fixDate(date: string) {
    const result: string = date.substring(0, 3) + "," + date.substring(3);
    return result;
  }

  sendEmail(email: Email) {
    this.mailerService
      .sendMail({
        to: email.to, // list of receivers
        from: email.from, // sender address
        subject: email.subject, // Subject line
        html: email.html, // HTML body content
      })
      .then((res) => {
        // console.log(res);
        return {
          message: "Email sent successfully",
        };
      })
      .catch((error) => {
        console.log(error);
        return {
          message: error.message,
        };
      });
  }

  async sendAdhocEmail(courseSegmentArr: GetCourseSegmentDto[]) {
    try {
      const resultsArray: Array<CourseSegment> = [];
      for (let i = 0; i < courseSegmentArr.length; i++) {
        const courseSegment: CourseSegment =
          await this.prisma.courseSegment.findUnique({
            where: {
              segment_course_name_fy_run: {
                segment: courseSegmentArr[i].segment,
                course_name: courseSegmentArr[i].course_name,
                fy: courseSegmentArr[i].fy,
                run: courseSegmentArr[i].run,
              },
            },
          });
        resultsArray.push(courseSegment);
      }
      await this.notifyTrainersBySegments(resultsArray);
      return {
        message: "Emails sent successfully",
      };
    } catch (error) {
      return error;
    }
  }

  sendWelcomeEmail(user_email: string, user_name: string, rawPassword: string) {
    const email: Email = this.craftWelcomeEmail(
      user_email,
      user_name,
      rawPassword,
    );
    return this.sendEmail(email);
  }

  sendResetPasswordEmail(
    user_email: string,
    user_name: string,
    rawPassword: string,
  ) {
    const email: Email = this.craftResetPasswordTemplate(
      user_email,
      user_name,
      rawPassword,
    );
    return this.sendEmail(email);
  }

  async notifyTrainersBySegments(segments: CourseSegment[]) {
    const segmentsByTrainer: Map<string, CourseSegment[]> =
      await this.groupSegmentsByTrainer(segments);
    for (const [trainer, segments] of segmentsByTrainer) {
      const getUserDto: GetUserDto = { user_name: trainer };
      const trainerEmail = (await this.userService.getUser(getUserDto)).email;
      const email: Email = this.craftTrainerCourseEmail(
        trainerEmail,
        trainer,
        segments,
      );
      this.sendEmail(email);
    }
  }

  async notifyNewlyAssignedTrainers(
    trainers: string[],
    dto: EditCourseSegmentDto,
  ) {
    // console.log(this.configService.get("SMTP_CONNECTION_STRING"));
    for (const trainer of trainers) {
      const getUserDto: GetUserDto = { user_name: trainer };
      const trainerEmail = (await this.userService.getUser(getUserDto)).email;
      const email: Email = this.craftNewlyAssignedEmail(
        trainerEmail,
        trainer,
        dto,
      );
      this.sendEmail(email);
    }
  }

  async notifyUnassignedTrainers(
    trainers: string[],
    dto: EditCourseSegmentDto,
  ) {
    for (const trainer of trainers) {
      const getUserDto: GetUserDto = { user_name: trainer };
      const trainerEmail = (await this.userService.getUser(getUserDto)).email;
      const email: Email = this.craftUnassignedEmail(
        trainerEmail,
        trainer,
        dto,
      );
      this.sendEmail(email);
    }
  }

  private craftNewlyAssignedEmail(
    trainerEmail: string,
    trainer: string,
    dto: EditCourseSegmentDto,
  ): Email {
    const segment: CourseSegment = {
      course_name: dto.course_name,
      segment: dto.segment,
      run: dto.run,
      fy: dto.fy,
      dates: dto.dates.map((dateString) => new Date(dateString)),
      status: Status.PENDING,
      createdAt: undefined,
      updatedAt: undefined,
    };
    const email: Email = {
      to: trainerEmail,
      from: FROM_ADDRESS,
      subject: `SMU Academy: You have been assigned a new course: ${dto.course_name}`,
      html: this.renderPendingTemplate(trainer, [segment]),
    };
    return email;
  }

  private craftUnassignedEmail(
    trainerEmail: string,
    trainer: string,
    dto: EditCourseSegmentDto,
  ): Email {
    const email: Email = {
      to: trainerEmail,
      from: FROM_ADDRESS,
      subject: `SMU Academy: You have been unassigned from a course: ${dto.course_name}`,
      html: this.renderUnassignedTemplate(trainer, dto),
    };
    return email;
  }

  // ======================================= HELPER FUNCTIONS ==========================================
  private craftTrainerCourseEmail(
    trainerEmail: string,
    trainer: string,
    segments: CourseSegment[],
  ): Email {
    const pendingSubject = `SMU Academy: New course dates pending confirmation`;
    const confirmedOrCancelledSubject = `SMU Academy: Updated schedules to your course(s)`;
    const email = {
      to: trainerEmail,
      from: FROM_ADDRESS,
      subject:
        segments.at(0).status == "PENDING"
          ? pendingSubject
          : confirmedOrCancelledSubject,
      html:
        segments.at(0).status == "PENDING"
          ? this.renderPendingTemplate(trainer, segments)
          : this.renderConfirmedOrCancelledTemplate(trainer, segments),
    };
    return email;
  }

  private craftWelcomeEmail(
    trainerEmail: string,
    trainer: string,
    rawPassword: string,
  ): Email {
    const subject = `SMU Academy: Your account has been created`;
    const email = {
      to: trainerEmail,
      from: FROM_ADDRESS,
      subject: subject,
      html: this.renderWelcomeTemplate(trainer, rawPassword),
    };
    return email;
  }

  private craftResetPasswordTemplate(
    trainerEmail: string,
    trainer: string,
    rawPassword: string,
  ): Email {
    const subject = `SMU Academy: Your account password has been reset`;
    const email = {
      to: trainerEmail,
      from: FROM_ADDRESS,
      subject: subject,
      html: this.renderResetPasswordTemplate(trainer, rawPassword),
    };
    return email;
  }

  private async groupSegmentsByTrainer(
    segments: CourseSegment[],
  ): Promise<Map<string, CourseSegment[]>> {
    const trainerMap: Map<string, CourseSegment[]> = new Map();
    for (const segment of segments) {
      const newStatus: Status = segment.status;
      if (
        newStatus == Status.PENDING ||
        newStatus == Status.CONFIRMED ||
        newStatus == Status.CANCELLED
      ) {
        const trainers =
          await this.trainerService.getAssignmentTrainersByCourseSegments(
            segment.fy,
            segment.course_name,
            segment.segment,
            segment.run,
          );
        for (const trainer of trainers) {
          if (!trainerMap.has(trainer.user_name)) {
            trainerMap.set(trainer.user_name, []);
          }
          trainerMap.get(trainer.user_name).push(segment);
        }
      }
    }
    return trainerMap;
  }

  private renderUnassignedTemplate(
    trainerName: string,
    dto: EditCourseSegmentDto,
  ): string {
    const startDate = new Date(dto.dates.at(0)).toDateString();
    const endDate = new Date(dto.dates.at(-1)).toDateString();

    const template = `
    <p>Dear ${trainerName},</p>
    <p>You have been unassigned the following course:</p>
    <table cellspacing="3" bgcolor="#000000">
      <tr bgcolor="#ffffff"><th>Course Name</th><th>Start Date</th><th>End Date</th><th>Status</th></tr>
      <tr bgcolor="#ffffff">
        <td style="padding: 1rem">${dto.course_name}</td>
        <td style="padding: 1rem">${this.fixDate(startDate)}</td>
        <td style="padding: 1rem">${this.fixDate(endDate)}</td>
        <td style="padding: 1rem">Unassigned</td>
      </tr>
    </table>
    <p>
      Please reach out to us if there are any issues.
    <br/>
    <br/>
      Thank you.
    </p>
    ${SIGN_OFF}
    `;
    return template;
  }

  private renderPendingTemplate(
    trainerName: string,
    segments: CourseSegment[],
  ): string {
    let template = `
    <p>Dear ${trainerName},</p>
    <p>You have new course(s) scheduled which require your acceptance or rejection.</p>
    <table cellspacing="3" bgcolor="#000000">
      <tr bgcolor="#ffffff">
        <th>Course Name</th>
        <th>Start Date</th>
        <th>End Date</th>
        <th>Status</th>
      </tr>
    `;
    for (const segment of segments) {
      const courseName = segment.course_name.replace(this.VERSION_REGEX, "");
      const startDate = segment.dates.at(0).toDateString();
      const endDate = segment.dates.at(-1).toDateString();
      template += `
      <tr bgcolor="#ffffff">
        <td style="padding: 1rem">${courseName}</td>
        <td style="padding: 1rem">${this.fixDate(startDate)}</td>
        <td style="padding: 1rem">${this.fixDate(endDate)}</td>
        <td style="padding: 1rem">${this.conversion(segment.status)}</td>
      </tr>
      `;
    }
    template += `
    </table>
    <p>
      Please log in to <href>${this.FRONTEND_URL}/status</href> to accept or decline the proposed dates.
      Should you not be available on the proposed dates, please suggest alternative dates via the above link.
    <br/>
    <br/>
      <span>Thank you.</span>
    </p>
    ${SIGN_OFF}
    `;
    return template;
  }

  private renderConfirmedOrCancelledTemplate(
    trainerName: string,
    segments: CourseSegment[],
  ) {
    let template = `
    <p>Dear ${trainerName},</p>
    <p>The status of your course(s) have been updated, as indicated in the following table: </p>
    <table cellspacing="3" bgcolor="#000000">
      <tr bgcolor="#ffffff">
        <th>Course Name</th>
        <th>Start Date</th>
        <th>End Date</th>
        <th>New Status</th>
      </tr>
    `;
    for (const segment of segments) {
      const courseName = segment.course_name.replace(this.VERSION_REGEX, "");
      const startDate = segment.dates.at(0).toDateString();
      const endDate = segment.dates.at(-1).toDateString();
      template += `
      <tr bgcolor="#ffffff">
        <td style="padding: 1rem">${courseName}</td>
        <td style="padding: 1rem">${this.fixDate(startDate)}</td>
        <td style="padding: 1rem">${this.fixDate(endDate)}</td>
        <td style="padding: 1rem">${this.conversion(segment.status)}</td>
      </tr>
      `;
    }
    template += `
    </table>

    <p>
      You may review the changes at <href>${this.FRONTEND_URL}/status</href>.
      Please reach out to us if there are any issues.
      <br/>
      <br/>
        <span>Thank you.</span>
    </p>

    ${SIGN_OFF}
    `;
    return template;
  }

  private renderWelcomeTemplate(trainerName: string, password: string) {
    const template = `
    <p>Dear ${trainerName},</p>
    <p>You have been added as a user to SMU Academy's scheduling application.</p>
    <p>Here are your login details:</p>
    <p>
      Username: <b>${trainerName}</b>
    <br>
      Password: <b>${password}</b>
    </p>
    <p>
      Kindly login to <href>${this.FRONTEND_URL}</href> to access your account.
    <br/>
    <br/>
      <span>Thank you.</span>
    </p>
    ${SIGN_OFF}
    `;
    return template;
  }

  private renderResetPasswordTemplate(trainerName: string, password: string) {
    const template = `
    <p>Dear ${trainerName},</p>
    <p>Your account password in SMU Academy's scheduling application has been reset.</p>
    <p>Here is your new password:</p>
    <p>
      Password: <b>${password}</b>
    </p>
    <p>
      Please log in to <href>${this.FRONTEND_URL}</href> to access your account and change the password immediately upon logging in.
    <br/>
    <br/>
      <span>Thank you.</span>
    </p>
    ${SIGN_OFF}
    `;
    return template;
  }
}
