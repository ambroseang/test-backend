import { Module } from "@nestjs/common";
import { DataIngestionService } from "./data-ingestion.service";

@Module({
  providers: [DataIngestionService],
  exports: [DataIngestionService],
})
export class DataIngestionModule {}
