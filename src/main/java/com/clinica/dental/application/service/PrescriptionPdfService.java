package com.clinica.dental.application.service;

import com.clinica.dental. common.exception.NotFoundException;
import com.clinica.dental.domain.model.Prescription;
import com.clinica.dental.domain.model.PrescriptionItem;
import com.clinica.dental.infrastructure.repository.PrescriptionRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class PrescriptionPdfService {

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final PrescriptionRepository prescriptionRepository;

    @Transactional(readOnly = true)
    public byte[] generatePdf(Long prescriptionId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new NotFoundException("Receta no encontrada"));

        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

            Document document = new Document(PageSize.A4, 48, 48, 42, 42);
            PdfWriter.getInstance(document, outputStream);

            document.open();

            addHeader(document);
            addPatientInfo(document, prescription);
            addDiagnosis(document, prescription);
            addMedications(document, prescription);
            addIndications(document, prescription);
            addControlAndNotes(document, prescription);
            addSignature(document, prescription);

            document.close();

            return outputStream.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("No se pudo generar el PDF de la receta", exception);
        }
    }

    private void addHeader(Document document) throws DocumentException {
        Font titleFont = FontFactory.getFont(
                FontFactory.HELVETICA_BOLD,
                18,
                new Color(15, 23, 42)
        );

        Font subtitleFont = FontFactory.getFont(
                FontFactory.HELVETICA,
                10,
                new Color(100, 116, 139)
        );

        Paragraph title = new Paragraph("CLÍNICA ODONTOLÓGICA", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(4);
        document.add(title);

        Paragraph subtitle = new Paragraph(
                "Receta odontológica e indicaciones post atención",
                subtitleFont
        );
        subtitle.setAlignment(Element.ALIGN_CENTER);
        subtitle.setSpacingAfter(18);
        document.add(subtitle);

        LineSeparator line = new LineSeparator();
        line.setLineColor(new Color(203, 213, 225));
        document.add(line);

        addSpace(document, 12);
    }

    private void addPatientInfo(
            Document document,
            Prescription prescription
    ) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1f, 1f});
        table.setSpacingAfter(14);

        String patientName = prescription.getPatient().getUser().getFullName();
        String dentistName = prescription.getDentist().getUser().getFullName();

        addInfoCell(table, "Paciente", patientName);
        addInfoCell(table, "Odontólogo", dentistName);

        addInfoCell(
                table,
                "Fecha de emisión",
                prescription.getCreatedAt() != null
                        ? prescription.getCreatedAt().toLocalDate().format(DATE_FORMAT)
                        : "-"
        );

        addInfoCell(
                table,
                "Cita",
                "#" + prescription.getAppointment().getId()
        );

        document.add(table);
    }

    private void addDiagnosis(
            Document document,
            Prescription prescription
    ) throws DocumentException {
        addSectionTitle(document, "Diagnóstico");

        String diagnosis = prescription.getDiagnosis();

        addBodyParagraph(
                document,
                diagnosis == null || diagnosis.isBlank()
                        ? "No registrado."
                        : diagnosis
        );
    }

    private void addMedications(
            Document document,
            Prescription prescription
    ) throws DocumentException {
        addSectionTitle(document, "Rp. / Medicamentos");

        if (prescription.getItems() == null || prescription.getItems().isEmpty()) {
            addBodyParagraph(document, "No se registraron medicamentos.");
            return;
        }

        int index = 1;

        for (PrescriptionItem item : prescription.getItems()) {
            Font bold = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    11,
                    new Color(15, 23, 42)
            );

            Font normal = FontFactory.getFont(
                    FontFactory.HELVETICA,
                    10,
                    new Color(51, 65, 85)
            );

            Paragraph medication = new Paragraph();
            medication.setSpacingAfter(5);
            medication.add(new Chunk(index + ". " + safe(item.getMedicationName()), bold));

            document.add(medication);

            StringBuilder details = new StringBuilder();

            if (notBlank(item.getDose())) {
                details.append("Dosis: ").append(item.getDose()).append(". ");
            }

            if (notBlank(item.getFrequency())) {
                details.append("Frecuencia: ").append(item.getFrequency()).append(". ");
            }

            if (notBlank(item.getDuration())) {
                details.append("Duración: ").append(item.getDuration()).append(". ");
            }

            if (details.length() > 0) {
                Paragraph detailParagraph = new Paragraph(details.toString(), normal);
                detailParagraph.setIndentationLeft(16);
                detailParagraph.setSpacingAfter(4);
                document.add(detailParagraph);
            }

            if (notBlank(item.getInstructions())) {
                Paragraph instructions = new Paragraph(
                        "Indicaciones: " + item.getInstructions(),
                        normal
                );
                instructions.setIndentationLeft(16);
                instructions.setSpacingAfter(10);
                document.add(instructions);
            }

            index++;
        }
    }

    private void addIndications(
            Document document,
            Prescription prescription
    ) throws DocumentException {
        addSectionTitle(document, "Indicaciones generales");
        addBodyParagraph(document, prescription.getIndications());
    }

    private void addControlAndNotes(
            Document document,
            Prescription prescription
    ) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1f, 1f});
        table.setSpacingBefore(10);
        table.setSpacingAfter(24);

        String nextControl = prescription.getNextControlDate() != null
                ? prescription.getNextControlDate().format(DATE_FORMAT)
                : "No registrado";

        addInfoCell(table, "Próximo control", nextControl);

        String notes = notBlank(prescription.getNotes())
                ? prescription.getNotes()
                : "Sin notas";

        addInfoCell(table, "Notas", notes);

        document.add(table);
    }

    private void addSignature(
            Document document,
            Prescription prescription
    ) throws DocumentException {
        addSpace(document, 24);

        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(45);
        table.setHorizontalAlignment(Element.ALIGN_RIGHT);

        PdfPCell lineCell = new PdfPCell(new Phrase(" "));
        lineCell.setBorder(Rectangle.TOP);
        lineCell.setBorderColor(new Color(100, 116, 139));
        lineCell.setPaddingTop(8);
        table.addCell(lineCell);

        Font signatureFont = FontFactory.getFont(
                FontFactory.HELVETICA,
                10,
                new Color(51, 65, 85)
        );

        PdfPCell nameCell = new PdfPCell(
                new Phrase("Dr(a). " + prescription.getDentist().getUser().getFullName(), signatureFont)
        );
        nameCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        nameCell.setBorder(Rectangle.NO_BORDER);
        table.addCell(nameCell);

        PdfPCell codeCell = new PdfPCell(
                new Phrase("Firma y sello", signatureFont)
        );
        codeCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        codeCell.setBorder(Rectangle.NO_BORDER);
        table.addCell(codeCell);

        document.add(table);
    }

    private void addInfoCell(
            PdfPTable table,
            String label,
            String value
    ) {
        Font labelFont = FontFactory.getFont(
                FontFactory.HELVETICA_BOLD,
                9,
                new Color(71, 85, 105)
        );

        Font valueFont = FontFactory.getFont(
                FontFactory.HELVETICA,
                10,
                new Color(15, 23, 42)
        );

        PdfPCell cell = new PdfPCell();
        cell.setPadding(10);
        cell.setBorderColor(new Color(226, 232, 240));
        cell.setBackgroundColor(new Color(248, 250, 252));

        Paragraph labelParagraph = new Paragraph(label, labelFont);
        labelParagraph.setSpacingAfter(4);

        Paragraph valueParagraph = new Paragraph(safe(value), valueFont);

        cell.addElement(labelParagraph);
        cell.addElement(valueParagraph);

        table.addCell(cell);
    }

    private void addSectionTitle(
            Document document,
            String title
    ) throws DocumentException {
        Font font = FontFactory.getFont(
                FontFactory.HELVETICA_BOLD,
                12,
                new Color(8, 145, 178)
        );

        Paragraph paragraph = new Paragraph(title, font);
        paragraph.setSpacingBefore(10);
        paragraph.setSpacingAfter(6);

        document.add(paragraph);
    }

    private void addBodyParagraph(
            Document document,
            String text
    ) throws DocumentException {
        Font font = FontFactory.getFont(
                FontFactory.HELVETICA,
                10,
                new Color(51, 65, 85)
        );

        Paragraph paragraph = new Paragraph(safe(text), font);
        paragraph.setLeading(15);
        paragraph.setSpacingAfter(10);

        document.add(paragraph);
    }

    private void addSpace(
            Document document,
            int height
    ) throws DocumentException {
        Paragraph space = new Paragraph(" ");
        space.setSpacingAfter(height);
        document.add(space);
    }

    private boolean notBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String safe(String value) {
        return value == null || value.trim().isEmpty()
                ? "-"
                : value.trim();
    }
}