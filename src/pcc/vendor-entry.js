import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import { renderAsync } from "docx-preview";
import qrcode from "qrcode-generator";
globalThis.PCCLIB = { PizZip, Docxtemplater, JSZip, renderDocx: renderAsync, qrcode };
