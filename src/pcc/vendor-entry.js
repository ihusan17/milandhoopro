import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import { renderAsync } from "docx-preview";
globalThis.PCCLIB = { PizZip, Docxtemplater, JSZip, renderDocx: renderAsync };
